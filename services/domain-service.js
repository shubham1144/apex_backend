var dao = require('./../dao/dao.js'),
    async = require('async'),
    util = require('./../helpers/util.js'),
    moment = require('moment'),
    constant = require('./../helpers/constant.js'),
    message = require('./../helpers/message.json'),
    shortid = require('shortid');


function formatNotificationStatistics(details){

     var stats = {
        month : moment().subtract(7, 'day').format("MM"),
        days : []
     }
     for(var i=1; i<=7; i++){
        if(stats['days'].indexOf(moment().subtract(i, 'day').format("YYYY-MM-DD") !==-1))
            stats['days'].push(moment().subtract(i, 'day').format("YYYY-MM-DD"))
     }
     return Object.assign(stats, details);

}
/**
    * Function to fetch A list of domains accessible for user registered on the platform
*/
exports.fetchDomains = function(user_id, page, domain_id, callback){

  var filter = domain_id ? {
       dID : parseInt(domain_id)
   } : {};
   var customized_keys = {
        "total_unread_notification_count" : 0
   };
   dao.getMultipleTableIterator(dao.TABLE_RECORD.DOMAIN, filter, {
       page : page || constant.PAGINATION.DEFAULT_PAGE,
       values : [['dID', 'id'], ['dDisplayName', 'title'], 'notifications', 'enq_count_stats', 'enq_res_time_stats', 'forms'],
       default_values : {
            'forms' : [],
            'notifications' : 0,
            'enq_count_stats' : formatNotificationStatistics({
                "enquiries" : {},
                "curr_week_total" : 0,
                "last_week_total" : 0
            }),
            'enq_res_time_stats' : formatNotificationStatistics({
              "response_times": {},
              "curr_week_avg": 0.0,
              "last_week_avg": 0.0
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

            if(!moment(moment.utc(item['eCreatedAt'])).isSame(moment.utc(), 'month')) return;

            if(moment(moment.utc(item['eCreatedAt'])).isSame(moment.utc(), 'week'))
            result_row["enq_count_stats"]["curr_week_total"]++;

            if(!result_row["enq_count_stats"]["enquiries"][moment.utc(item['eCreatedAt']).format("YYYY-MM-DD")])
            result_row["enq_count_stats"]["enquiries"][moment.utc(item['eCreatedAt']).format("YYYY-MM-DD")] = 1;
            else result_row["enq_count_stats"]["enquiries"][moment.utc(item['eCreatedAt']).format("YYYY-MM-DD")]++;


            if(item["eStatus"] === 'Unread'){
            customized_keys["total_unread_notification_count"]++;
            }

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