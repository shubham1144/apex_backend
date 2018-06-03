var dao = require('./../dao/dao.js'),
    async = require('async'),
    util = require('./../helpers/util.js'),
    moment = require('moment'),
    constant = require('./../helpers/constant.js'),
    message = require('./../helpers/message.json'),
    shortid = require('shortid');


function formatNotificationStatistics(day_stats_key, details){

     var stats = Object.assign(details,{
        month : moment().utc().subtract(7, 'day').format("MM"),
        days : []
     })
     for(var i=6; i>=0; i--){
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
                if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') >=14) return;
                else if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') <=6){
                    result_row["enq_count_stats"]["curr_week_total"]++;
                    result_row['statistics'][item['eID']] = moment.utc(item['eCreatedAt']);
                }
                else if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') <=13){
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
        custom_function : function(result_row, item){

        /*Response Time Stats START*/
            //                        if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') >=14) return;
            //                        //update the average associated with the last (Inclusive)1-7(Exclusive) days
            //                        else if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') <=6){
            //
            //                            //Current day average
            //                            //Current week average : Average of all days involved
            //                        }
            //                        //update the average associated with the last (Inclusive)7-14(Exclusive) days
            //                        else if(moment().utc().diff(moment.utc(item['eCreatedAt']), 'days') <=13){
            //                            //Last week average : Average of all days involved
//                        }
                    /*Response Time Stats END*/
            console.log("The statistics involved are : ", result_row['statistics'])
            console.log(item.eID, moment.utc().diff(item.clCreatedAt, 'minutes'))

        }
       }
       ],
       function(err, result, requested_count_details){

            if(err) {
                console.error(message.error.default_error_prefix, err);
                return callback({
                    code : err.code || message.code.custom_bad_request,
                    message : err.message || message.error.internal_server_error
                })
            }
             callback(null, Object.assign(requested_count_details || {}, customized_keys, {
                companies : result
             }));


       })

    },
    fetch_notification_stats : function(callback){

    },
    format_result : ['fetch_domains', 'fetch_notification_stats', function(results, callback){

    }]
  }, function(err, result){
        console.log("The details associated with the operation are", err, result)
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