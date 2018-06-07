var dao = require('./../dao/dao.js'),
    async = require('async'),
    util = require('./../helpers/util.js'),
    moment = require('moment'),
    constant = require('./../helpers/constant.js'),
    message = require('./../helpers/message.json'),
    shortid = require('shortid');

/*Function to be used to Process the Notification statistics associated with Domains*/
var stats_threshold_days = 14,
notification_stats = {

    generate : function(domain_item, callback){

        var response_time_counter = {}, response_time_stat = {}, last_week_sum = 0.0, current_week_sum = 0.0;
        //Calculates the Daily Average Value involved
        async.eachSeries(domain_item['statistics'], function(stat, callback){

            if(stat.response_time === undefined) return callback(null);

            if(response_time_counter[moment(stat['created_at']).utc().format("YYYY-MM-DD")] === undefined)
                response_time_counter[moment(stat['created_at']).utc().format("YYYY-MM-DD")] = 1;
            else response_time_counter[moment(stat['created_at']).utc().format("YYYY-MM-DD")]++;

            if(!response_time_stat[moment(stat['created_at']).utc().format("YYYY-MM-DD")]){
                response_time_stat[moment(stat['created_at']).utc().format("YYYY-MM-DD")] = stat.response_time;
            }
            else response_time_stat[moment(stat['created_at']).utc().format("YYYY-MM-DD")]=
                parseFloat(((response_time_stat[moment(stat['created_at']).utc().format("YYYY-MM-DD")] + stat.response_time)/
                response_time_counter[moment(stat['created_at']).utc().format("YYYY-MM-DD")]).toFixed(2));

            callback(null);

        }, function(err){

            //Calculates the Weekly Average Involved
            _.forEach(response_time_stat, function(day_response_time, day){

                if(moment().utc().diff(moment(day).utc(), 'days') <= ((stats_threshold_days/2)-1)){
                    domain_item['enq_res_time_stats']['response_times'][day] = day_response_time;
                        current_week_sum+=day_response_time;
                }
                else if(moment().utc().diff(moment(day).utc(), 'days') <= (stats_threshold_days-1)){
                    last_week_sum+=day_response_time;
                }

            })
            domain_item['enq_res_time_stats']['curr_week_avg'] = parseFloat((current_week_sum/(stats_threshold_days/2)).toFixed(2));
            domain_item['enq_res_time_stats']['last_week_avg'] = parseFloat((last_week_sum/(stats_threshold_days/2)).toFixed(2));

            delete domain_item['statistics'];
            callback(null);

        })

    },
    process_call_logs :function(result_row, item){

        if(moment().utc().diff(moment.utc(item['clCreatedAt']), 'days') >= stats_threshold_days) return;
        if(result_row['statistics'][item.eID] && result_row['statistics'][item.eID]['response_time']!== undefined){
        if( moment(item.clCreatedAt).utc().diff(result_row['statistics'][item.eID]['created_at'], 'minutes')< result_row['statistics'][item.eID]['response_time']){
            result_row['statistics'][item.eID]['response_time'] = moment(item.clCreatedAt).utc().diff(result_row['statistics'][item.eID]['created_at'], 'minutes')
        }
        }else if(result_row['statistics'][item.eID]){
            result_row['statistics'][item.eID]['response_time'] = moment(item.clCreatedAt).utc().diff(result_row['statistics'][item.eID]['created_at'], 'minutes');
        }

    }
};

function formatNotificationStatistics(day_stats_key, details){

     var stats = Object.assign(details,{
        month : moment().utc().subtract((stats_threshold_days/2), 'day').format("MM"),
        days : []
     })
     for(var i=(stats_threshold_days/2)-1; i>=0; i--){
        if(stats['days'].indexOf(moment().utc().subtract(i, 'day').format("YYYY-MM-DD") !==-1)){
            stats[day_stats_key][moment().utc().subtract(i, 'day').format("YYYY-MM-DD")] = 0;
            stats['days'].push(moment().utc().subtract(i, 'day').format("YYYY-MM-DD"))
        }

     }
     return stats;

}


/**
    * Function to fetch A list of domains accessible for user registered on the platform
*/
exports.fetchDomains = function(user_id, page, callback){

  async.auto({
    fetch_domains : function(callback){

       var customized_keys = {
            "total_unread_notification_count" : 0
       };

       dao.getMultipleTableIterator(dao.TABLE_RECORD.DOMAIN, {}, {
           page : page || constant.PAGINATION.DEFAULT_PAGE,
           values : [['dID', 'id'], ['dDisplayName', 'title'], 'notifications', 'enq_count_stats', 'enq_res_time_stats', 'forms', 'statistics'],
           default_values : {
                'statistics' : {},
                'forms' : [],
                'notifications' : 0,
                'enq_count_stats' : formatNotificationStatistics("enquiries", {
                    "enquiries" : {},
                    "curr_week_total" : 0,
                    "last_week_total" : 0
                }),
                'enq_res_time_stats' : formatNotificationStatistics("response_times", {
                  "response_times": {},
                  "curr_week_avg": 1.1,
                  "last_week_avg": 1.1
                })
           }
       },
       [{
           table_name : dao.TABLE_RECORD.FORM,
           alias : 'forms',
           join_fetch : true,
           condition : {
               'users' : {
                   '$contains' : user_id
               }
           },
           values : [['dfID', 'id'], ['dfName', 'name'], 'no_of_unread_notifications'],
           default_values : {
                'no_of_unread_notifications' : 0
           }
       },
       {
             table_name : dao.TABLE_RECORD.ENQUIRY,
             alias : 'notifications',
             custom_function : function(result_row, item){

               if(item["eStatus"] && item["eStatus"] === 'Unread') customized_keys["total_unread_notification_count"]++;

               /*Enquiry Count Stats START*/
               if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') >= stats_threshold_days) return;
               else if(moment().utc().diff(moment(item['eCreatedAt']).utc(), 'days') <= (stats_threshold_days/2)){
                   result_row["enq_count_stats"]["curr_week_total"]++;
                   result_row['statistics'][item['eID']] = {
                   created_at : moment(item['eCreatedAt']).utc()
                   };
               }
               else if(moment().utc().diff(moment(item['eCreatedAt']).utc(), 'days') <= (stats_threshold_days-1)){
                result_row["enq_count_stats"]["last_week_total"]++;
               }

               if(result_row["enq_count_stats"]["enquiries"][moment.utc(item['eCreatedAt']).format("YYYY-MM-DD")]!==undefined)
               result_row["enq_count_stats"]["enquiries"][moment.utc(item['eCreatedAt']).format("YYYY-MM-DD")]++;
               /*Enquiry Count Stats END*/

             },
             parent_counter : {
               'forms' : {
                   alias : 'no_of_unread_notifications',
                   bind_key : ['dfID', 'id'],
                   condition : {
                       'eStatus' : 'Unread'
                   }
               }
             },
             count_fetch : true
       },
       {
        table_name : dao.TABLE_RECORD.CALL_LOG,
        custom_function : notification_stats.process_call_logs,
        unlink : true
       }
       ],
       function(err, result, requested_count_details){

             callback(err, Object.assign(requested_count_details || {}, customized_keys, {
                companies : result
             }));

       })

    },
    notification_response_stats : ['fetch_domains', function(results, callback){

        async.each(results.fetch_domains.companies, notification_stats.generate, function(err){
            callback(err, results.fetch_domains)
        })

    }]
  }, function(err, result){
        if(err) {
            console.error(message.error.default_error_prefix, err);
            return callback({
            code : err.code || message.code.custom_bad_request,
            message : err.message || message.error.internal_server_error
            })
        }
        callback(null, result.notification_response_stats);
  })

};

/**
    * Function to add a domain in the system
*/
exports.addDomain = function(user_id, callback){

    /*Currently Adding mock Data in the System Till the functionality is Ready and Working*/
    var domain_id = shortid.generate(),
    domain_form_id = shortid.generate();
    dao.createDataWithChild(dao.TABLE_RECORD.DOMAIN, ['dID', 'dCreatedByUID'], {
        pID : 'B19VQme1X',
        sID : 'ryviBmx1m',
        dID : domain_id,
        dCreatedByUID : user_id,
        dDisplayName : 'Test Domain ' + moment().format("DD/MM/YY") + " " + domain_id ,
        dKey : 'test12345678911',
        dStatus : true,
        dVerified : true,
        dUrl : 'http://tentwenty.me',
        disPingAllowed : true
    },
    [
    {
        table_name : dao.TABLE_RECORD.FORM,
        data : {
            pID : 'B19VQme1X',
            sID : 'ryviBmx1m',
            dID : domain_id,
            dfID : domain_form_id,
            dfName : 'Test Domain ' + moment().format("DD/MM/YY") + " " + domain_id + " - Form " + domain_form_id,
            users : [user_id]
        }
    }
    ],
    function(err, callback){

        if(err) {
            console.error(message.error.default_error_prefix, err);
            return callback({
            code : err.code || message.code.custom_bad_request,
            message : err.message || message.error.internal_server_error
            })
        }

        callback(null, {
            msg : "Mock Domain has been registered in the system"
        })

    });

};