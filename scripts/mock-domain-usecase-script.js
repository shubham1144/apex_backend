/**
    *Script to Mock Notifications and Call Logs associated With Domain Forms
*/

var dao = require('./../dao/dao.js'),
    async = require('async'),
    shortid = require('shortid'),
    notification_service = require('./../services/notification-service.js');

setTimeout(function(){

    async.auto({
        create_test_domain : function(callback){

             /*Currently Adding mock Data in the System Till the functionality is Ready and Working*/
                var domain_id = shortid.generate(),
                domain_form_id = shortid.generate();
                dao.createDataWithChild(dao.TABLE_RECORD.DOMAIN, ['dID', 'dCreatedByUID'], {
                    "pID":"B1Imcq8eQ","sID":"rJsd558gm","dID" : "SyjoMBqeQ","dCreatedByUID" : "H1ZFVFqIlm",
                    dDisplayName : 'Test Invesense' ,
                    dKey : 'test12345678911',
                    dStatus : true,
                    dVerified : true,
                    dUrl : 'https://www.invensense.com',
                    disPingAllowed : true
                },
                [
                {
                    table_name : dao.TABLE_RECORD.FORM,
                    data : {
                   "pID":"B1Imcq8eQ","sID":"rJsd558gm","dID" : "SyjoMBqeQ","dCreatedByUID" : "H1ZFVFqIlm","dfID":"SyxooGS5gQ",
                        dfName : 'Contact Us',
                        users : ["H1ZFVFqIlm", "SJWbtYqLgQ", "SJbb3Yq8eQ"]
                    }
                }
                ],
                function(err, results){

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

        },
        fetch_domain_forms : function(callback){
//            return callback(null);
            dao.getMultipleTableIterator(dao.TABLE_RECORD.FORM, {
            "pID":"B19VQme1X","sID":"ryviBmx1m","dID":"SyjoMBqeQ","dCreatedByUID":"H1ZFVFqIlm","dfID":"SyxooGS5gQ"
            }, {}, [], function(err, result){
                callback(err, result)
            })

        },
        generate_notifications : ['fetch_domain_forms', function(results, callback){

//            console.log("The result being received is : ", results.fetch_domain_forms);
            //return callback(null);

            async.eachOf(results.fetch_domain_forms, function(domain, key, callback){

                async.times(1, function(n, next) {
                   var notification_data = Object.assign({
                   "pID":"B1Imcq8eQ","sID":"rJsd558gm","dID":"SyjoMBqeQ","dCreatedByUID":"H1ZFVFqIlm","dfID":"SyxooGS5gQ"
                   }, {
                       ePhone : '+918975567457',
                       eEmail : 'patrick@tentwenty.me',
                       eFirstName : 'patrick',
                       eFormAllDetails : "",
                       eFormLinkedDetails : JSON.stringify(
                           [{
                               "type": "text",
                               "key": "last_name",
                               "value": "de jongh"
                           },
                           {
                               "type": "text",
                               "key": "company",
                               "value": "Tentwenty"
                           },
                           {
                               "type": "text",
                               "key": "business",
                               "value": "Reseller Opportunity"
                           },{
                               "type": "text",
                               "key": "timeframe",
                               "value": "7 days"
                           }]
                       ),
                       eStatus : 'Unread'
                   })

                   notification_service.addNotification(notification_data, next)
                }, function(err) {
                    console.log("Trying to generate a notification associated with Domain Form : ", err)
                    callback(err)
                });

            }, function(err){
                callback(err);
            })

        }],
        generate_call_logs : ['generate_notifications', function(results, callback){
//"pID":"B19VQme1X","sID":"ryviBmx1m","dID":"SyjoMBqeQ","dCreatedByUID":"H1ZFVFqIlm","dfID":"SyxooGS5gQ","eID":"H1fG5SclX"
            return callback(null);

//            dao.getMultipleTableIterator(dao.TABLE_RECORD.ENQUIRY, {}, {}, [], function(err, result){
//                async.each(result, function(notification, callback){
                    notification_service.addCallLog("H1ZFVFqIlm", "Bk9CoL9eX", {
                        note : "Tried Calling the person..not reached",
                        status : 2
                    }, callback)
//                }, function(err){
//                    callback(err)
//                })

//            })
        }]
    }, function(err, result){
        console.log("Error occured due to : ", err, result)
    })

}, 2000);
