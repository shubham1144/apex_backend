var shortid = require('shortid'),
    async = require('async'),
    moment = require('moment'),
    _ = require('lodash'),
    payload_validator = require('./../helpers/payload_validator.js'),
    constant = require('./../helpers/constant.js'),
    message = require('./../helpers/message.json'),
    dao = require('./../dao/dao.js'),
    util = require('./../helpers/util.js'),
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
    *@todo  Allow to fetch only notification that are accessible to the user
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

        dao.getMultipleTableIterator(dao.TABLE_RECORD.ENQUIRY, {}, {
            page : page || constant.PAGINATION.DEFAULT_PAGE,
            parent_index_filter : form_id ? {
                table_name : dao.TABLE_RECORD.FORM,
                index : 'dfID',
                value : form_id,
                message : message.error.notification.missing_form_id
            } :
            domain_id? {
                table_name : dao.TABLE_RECORD.DOMAIN,
                index : 'dID',
                value : domain_id,
                message : message.error.notification.missing_domain_id
            } : null,
            values : [
                ['eID', 'id'], ['eFirstName', 'first_name'], ['ePhone', 'phone'], ['eEmail', 'email'],
                ['eCreatedAt', 'created_at'], ['eStatus', 'status', STATUS_CODE.NOTIFICATION], ['eIsArchived', 'is_archived'],
                ['eIsDeleted', 'is_deleted'], 'call_logs'
            ],
            default_values: {
                'call_logs' : [],
                'is_archived' : 0,
                'is_deleted' : 1
            },
            custom_function : function(result_row, item){

                result_row['custom_fields'] = util.jsonParseSync(item["eFormLinkedDetails"])? util.jsonParseSync(item["eFormLinkedDetails"]) : [];

            },
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
                    table_name : dao.TABLE_RECORD.DOMAIN,
                    values : [['dDisplayName', 'domain_name'], ['dID', 'domain_id']]
                },
                {
                    table_name : dao.TABLE_RECORD.FORM,
                    values : [['dfName', 'form_name'],  ['dfID', 'form_id']]
                },
                {
                    table_name : dao.TABLE_RECORD.CALL_LOG,
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
        callback(null, { status : STATUS_CODE.NOTIFICATION });
    }

};

/**
    *Function to fetch Details associated with  Enquiry Notification Details
*/
exports.fetchNotification = function(notification_id, callback){

    dao.getOneIndexIterator(dao.TABLE_RECORD.ENQUIRY, "eID", notification_id || null,
    [{
        table_name : dao.TABLE_RECORD.CALL_LOG,
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
        ],
        default_values: {
            'call_logs' : [],
            'is_archived' : 0,
            'is_deleted' : 1
        },
        custom_function : function(result_row, item){
            result_row['custom_fields'] = util.jsonParseSync(item["eFormLinkedDetails"])? util.jsonParseSync(item["eFormLinkedDetails"]) : [];
        }
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
    }, dao.TABLE_RECORD.ENQUIRY, {
            //Currently, the data is mocked till the functionality is available
        "pID":"B19VQme1X","sID":"ryviBmx1m","dID":"S1EZJJ1x7","dCreatedByUID":"S1XGA00J7","dfID":"SJgVWJJklm",
            eID : shortid.generate(),
            ePhone : '8975567457',
            eEmail : 'testuser10@tentwenty.me',
            eFormAllDetails : "",
            eFormLinkedDetails : JSON.stringify(
                [{
                "type": "text",
                "key": "Mock Keyword 01",
                "value": "Mock Keyword 01 Content"
                },{
                "type": "text",
                "key": "Mock Keyword 02",
                "value": "Mock Keyword 02 Content"
                }]
            ),
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
            message : message.error.notification.missing_id
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
            dao.updateChildIndexIterator(dao.TABLE_RECORD.ENQUIRY,
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null,
            [ {
                 table_name : dao.TABLE_RECORD.CALL_LOG,
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
                    if(err.code && err.code == message.code.not_found){
                        return callback({
                            code : err.code,
                            message : message.error.notification.not_found
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
            msg: message.success.notification.call_log_captured,
            id : results.create_call_log
        });

    });

};

/**
    * Function to Update the Details associated with an Existing Call Log
*/
exports.updateCallLog = function(notification_id, data, callback){

    if(!notification_id || notification_id === undefined){
        return callback({
            code : message.code.bad_request,
            message : message.error.notification.missing_id
        })
    }
    var required_keys = ['call_log_id', 'status', 'note'];
    payload_validator.ValidatePayloadKeys(data, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("call_log_id")){
                 return callback({
                    code : message.code.custom_bad_request,
                    message : message.error.notification.missing_call_log_id
                 })
            }
        }
        dao.updateChildIndexIterator(dao.TABLE_RECORD.ENQUIRY,
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null,
            [ {
                 table_name : dao.TABLE_RECORD.CALL_LOG,
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
                    msg: message.success.notification.call_log_updated
                });

        })
    });

};