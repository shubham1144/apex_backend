/**
    *Script to Mock Notifications and Call Logs associated With Domain Forms
*/

var dao = require('./../dao/dao.js'),
    async = require('async'),
    notification_service = require('./../services/notification-service.js');

setTimeout(function(){

    async.auto({
        fetch_domain_forms : function(callback){

            dao.getMultipleTableIterator(dao.TABLE_RECORD.FORM, {}, {}, [], function(err, result){
                callback(err, result)
            })

        },
        generate_notifications : ['fetch_domain_forms', function(results, callback){

            async.eachOf(results.fetch_domain_forms, function(domain, key, callback){

                async.times(15, function(n, next) {
                   var notification_data = Object.assign(domain, {
                       ePhone : '8975567457',
                       eEmail : 'testuser' + n + '@tentwenty.me',
                       eFormAllDetails : "",
                       eFormLinkedDetails : JSON.stringify(
                           [{
                               "type": "text",
                               "key": "last_name",
                               "value": "Test LastName"
                           },
                           {
                               "type": "text",
                               "key": "company",
                               "value": "Test Company"
                           },
                           {
                               "type": "text",
                               "key": "Mock Keyword" + n,
                               "value": "Mock Keyword " + n + " Content"
                           },{
                               "type": "text",
                               "key": "Mock Keyword 02",
                               "value": "Mock Keyword 02 Content"
                           }]
                       ),
                       eStatus : 'Unread'
                   })
                   notification_service.addNotification(notification_data, next)
                }, function(err) {
                    callback(err)
                });

            }, function(err){
                callback(err);
            })

        }],
        generate_call_logs : ['generate_notifications', function(results, callback){

            dao.getMultipleTableIterator(dao.TABLE_RECORD.ENQUIRY, {}, {}, [], function(err, result){
                async.each(result, function(notification, callback){
                    notification_service.addCallLog("rJfFCcb1X", notification['eID'], {
                        note : "Test Call Log",
                        status : 0
                    }, callback)
                }, function(err){
                    callback(err)
                })

            })
        }]
    }, function(err, result){
        console.log("Error occured due to : ", err, result)
    })

}, 2000);
