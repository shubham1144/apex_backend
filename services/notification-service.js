var shortid = require('shortid'),
    async = require('async'),
    moment = require('moment'),
    _ = require('lodash'),
    payload_validator = require('./../helpers/payload_validator.js'),
    constant = require('./../helpers/constant.js'),
    message = require('./../helpers/message.json'),
    dao = require('./../dao/dao.js'),
    userService = require('./user-service.js');

/* Customizable Objects associated with the Status Codes */
var STATUS_CODE = {

    'NOTIFICATION' : {
        'Unread' : 0,
        'Read' : 1,
        'NotReachable' : 2,
        'Engaged' : 3
    },
    'CALL_LOG' : {
        'NotCalled' : 0,
        'Called' : 1,
        'Engaged' : 3,
        'NotReachable' : 2
    }

};


/**
    * Function to fetch a list of notifications associated with the Platform
    *@todo : Allow to fetch only notification that are accessible to the user
*/
exports.fetchNotifications = function(domain_id, form_id, page, keywords, archieve, status, callback){

        var condition_filter = {};

        if(archieve){
            condition_filter = Object.assign(condition_filter, {
                'eIsArchived' : {
                    '$equals' : archieve === '1' ? true : false
                }
            })
        }
        console.log("The condition filter involved is : ", condition_filter)
        if(status){

            var status_filter = [],
                status_preprocess_list = status && status !== undefined && status.split(",");

            status_preprocess_list && status_preprocess_list.forEach(function(key){

                if(_.invert(STATUS_CODE.NOTIFICATION)[key] !== undefined) status_filter.push(_.invert(STATUS_CODE.NOTIFICATION)[key]);

            })
            condition_filter = Object.assign(condition_filter, {
                'eStatus' : {
                    '$equalsAny' : status_filter
                }
            })
        }

        dao.getMultipleTableIterator('Plans.Subscriptions.Domains.Forms.Enquiry', {}, {
            page : page || constant.PAGINATION.DEFAULT_PAGE,
            parent_index_filter : form_id ? {
                table_name : 'Plans.Subscriptions.Domains.Forms',
                index : 'dfID',
                value : form_id,
                message : "Form Id Not Found"
            } :
            domain_id? {
                table_name : 'Plans.Subscriptions.Domains',
                index : 'dID',
                value : domain_id,
                message : "Domain Id Not Found"
            } : null,
            values : [
                ['eID', 'id'], ['eFirstName', 'first_name'], ['ePhone', 'phone'], ['eEmail', 'email'],
                ['eCreatedAt', 'created_at'], ['eStatus', 'status', STATUS_CODE.NOTIFICATION], ['eIsArchived', 'is_archived'],
                ['eIsDeleted', 'is_deleted'], 'custom_fields', 'call_logs'
            ],
            custom_count_fetch : [{
                key : 'is_archived',
                criteria : true,
                alias : 'archive_count'
            }, {
                key : 'status',
                criteria : STATUS_CODE.NOTIFICATION.Unread,
                alias : 'total_unread_notification_count'
            }],
            search_keyword : {
                value : keywords || null,
                filter_keys : ['ePhone', 'eEmail']
            },
            condition : condition_filter,
            sort_by : {
                key : 'status',
                order : [   STATUS_CODE.NOTIFICATION['Engaged'],
                            STATUS_CODE.NOTIFICATION['Unread'],
                            STATUS_CODE.NOTIFICATION['NotReachable'],
                            STATUS_CODE.NOTIFICATION['Read']
                ]
            }
        }, [
                {
                    table_name : 'Plans.Subscriptions.Domains',
                    values : [['dDisplayName', 'domain_name'], ['dID', 'domain_id']]
                },
                {
                    table_name : 'Plans.Subscriptions.Domains.Forms',
                    values : [['dfName', 'form_name'],  ['dfID', 'form_id']]
                },
                {
                    table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
                    alias : 'call_logs',
                    values : [  ['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'],
                                ['clUpdatedAt', 'updated_at'], ['clStatus', 'status', STATUS_CODE.CALL_LOG], ['clNote', 'note']
                    ]
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
            callback(null, Object.assign(requested_count_details || {}, {
                notifications : result
            }));

        });

};

/**
    * Function to fetch Status Codes associated with the Application
    *@todo The api is not being used yet, Once we reach a scalable phase, we can change the Client Side Logic to customized values for notification status.
*/
exports.fetchNotificationStatusCodes = function(type, callback){

    if(type && type === 'call_log'){
         callback(null, { status : STATUS_CODE.CALL_LOG });
    }else {
        callback(null, { status :  STATUS_CODE.NOTIFICATION });
    }

};

/**
    *Function to fetch Details associated with  Enquiry Notification Details
*/
exports.fetchNotification = function(notification_id, callback){

    dao.getOneIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry', "eID", notification_id || null,
    [{
        table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
        alias : 'call_logs',
        values : [  ['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clUpdatedAt', 'updated_at'],
                    ['clStatus', 'status',  STATUS_CODE.CALL_LOG], ['clNote', 'note']
        ]
    }],
    {
        values : [
            ['eID', 'id'], ['eFirstName', 'first_name'], ['ePhone', 'phone'], ['eEmail', 'email'], ['dID', 'domain_id'], 'domain_name',
            ['dfID', 'form_id'], 'form_name', ['eCreatedAt', 'created_at'], ['eStatus', 'status', STATUS_CODE.NOTIFICATION], ['eIsArchived', 'is_archived'],
            ['eIsDeleted', 'is_deleted'], 'custom_fields', 'call_logs'
        ]
    }, function(err, result){

        if(err) {
            console.error(message.error.default_error_prefix, err);
            return callback({
                code : err.code || message.code.custom_bad_request,
                message : err.message || message.error.internal_server_error
            })
        }
        callback(null, result);

    });

};

/**
    *Function associated with Registering a enquiry in the System
    *@todo Remove Data Mocks associated with the Notifications API
*/
exports.addNotification = function(data, callback){

    dao.putData({
    }, 'Plans.Subscriptions.Domains.Forms.Enquiry', {
            //Currently, the data is mocked till the functionality is available
            "pID":"B19VQme1X","sID":"ryviBmx1m","dID":"r1Hn91EyX","dCreatedByUID":"r1UH8Of1m","dfID":"HyxH391EkQ",
            eID : shortid.generate(),
            ePhone : '8975567457',
            eEmail : 'testuser10@tentwenty.me',
            eFormAllDetails : "",
            eStatus : 'Unread',
            eCreatedAt : moment.utc().format(),
            eUpdatedAt : moment.utc().format(),
            eIsArchived : false,
            eIsDeleted : false
    }, function(err, result){

        if(err) {
            console.error(message.error.default_error_prefix, err);
            return callback({
                code : err.code || message.code.custom_bad_request,
                message : err.message || message.error.internal_server_error
            })
        }
        callback(null, {
            msg: 'Mock Notification generated Successfully'
        });

    });

};

/**
    * Function to update Call Logs associated with Enquiry
*/
exports.addCallLog =  function(user_id, notification_id, data, callback){

    if(!notification_id || notification_id === undefined){
        callback({
            code : message.code.bad_request,
            message : 'notification_id not provided'
        })
    }
    async.auto({
        fetch_calling_user_details : function(callback){

            userService.fetchUser(user_id, function(err, result){
                if(err) return callback(err);
                var user_details = {
                    first_name : result.user.first_name || null,
                    last_name : result.user.last_name || null,
                    user_id : result.user.user_id,
                    user_contact : result.user.contact.country_code + " " + result.user.contact.phone_number
                }
                callback(null, user_details)
           })

        },
        create_call_log : ['fetch_calling_user_details', function(results, callback){

            var call_log_id = shortid.generate();
            dao.updateChildIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry',
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null,
            [ {
                 table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
                 create : true,
                 data : {
                     clID : call_log_id,
                     clStatus : data.status && (_.invert(STATUS_CODE.CALL_LOG))[data.status] || "NotCalled",
                     clCreatedAt : moment.utc().format(),
                     clUpdatedAt : moment.utc().format(),
                     clUserDetails : results.fetch_calling_user_details || {},
                     clNote : data.note || null
                 }
             }],
            function(err){

                if(err){
                    if(err.code && err.code == 401){
                        return callback({
                            code : err.code,
                            message :  "Notification Not Found"
                        })
                    }
                    return callback(err)
                }
                callback(err, call_log_id);

            })

        }]
    }, function(err, results){


        if(err) {
            console.error(message.error.default_error_prefix, err);
            return callback({
            code : err.code || message.code.custom_bad_request,
            message : err.message || message.error.internal_server_error
            })
        }
        callback(null, {
            msg: 'Call Log has been generated Successfully',
            id : results.create_call_log
        });

    });

};

/**
    * Function to Update the Details associated with an Existing Call Log
*/
exports.updateCallLog = function(notification_id, data, callback){

    if(!notification_id || notification_id === undefined){
        return util.formatErrorResponse(400, 'notification_id not provided', function(err){
            res.send(err);
        })
    }
    var required_keys = ['call_log_id', 'status', 'note'];
    payload_validator.ValidatePayloadKeys(data, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("call_log_id")){
                 return callback({
                    code : 0,
                    message : "Please Provide call_log_id"
                 })
            }
        }
        dao.updateChildIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry',
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null,
            [ {
                 table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
                 condition : {
                    'clID' : {
                        '$equals' :  data.call_log_id
                    }
                 },
                 data : {
                     clStatus : data.status && (_.invert(STATUS_CODE.CALL_LOG))[data.status] || "NotCalled",
                     clUpdatedAt : moment.utc().format(),
                     clNote : data.note || null
                 }
             }],
            function(err){

                if(err) {
                    console.error(message.error.default_error_prefix, err);
                    return callback({
                        code : err.code || message.code.custom_bad_request,
                        message : err.message || message.error.internal_server_error
                    })
                }
                callback(null, {
                    msg: 'Call Log has been Updated Successfully'
                });

            })
    });

};