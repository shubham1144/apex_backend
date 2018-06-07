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

                async.times(20, function(n, next) {
                   var notification_data = Object.assign(domain, {
                       ePhone : '8975567457',
                       eEmail : 'testuser' + n + '@tentwenty.me',
                       eFirstName : 'Idris',
                       eFormAllDetails : "",
                       eFormLinkedDetails : JSON.stringify(
                           [{
                               "type": "text",
                               "key": "last_name",
                               "value": "Hashmi"
                           },
                           {
                               "type": "text",
                               "key": "company",
                               "value": "Invesense"
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
                       eStatus : 'Read'
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
                    notification_service.addCallLog("H1ZFVFqIlm", notification['eID'], {
                        note : "Test Call Log Called Person",
                        status : 2
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
