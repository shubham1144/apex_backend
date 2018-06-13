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
*/
exports.fetchNotifications = function(user_id, domain_id, form_id, page, keywords, archive, status, callback){

        var customized_keys = {
            "archive_count" : 0
       }, condition_filter = {};
        condition_filter = Object.assign(condition_filter, {
            'eIsArchived' : {
                '$equals' : archive && archive === '1' ? true : false
            }
        })

        if(status){

            var status_filter = [],
                status_preprocess_list = status && status !== undefined && status.split(",");

            status_preprocess_list && status_preprocess_list.forEach(function(key){

                if(_.invert(STATUS_CODE.NOTIFICATION)[key] !== undefined) status_filter.push(_.invert(STATUS_CODE.NOTIFICATION)[key]);

            });
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
                ['eCreatedAt', 'created_at', function(column){
                     return util.formatDate(column)
                 }], ['eStatus', 'status', STATUS_CODE.NOTIFICATION], ['eIsArchived', 'is_archived', function(column){
                    if(column) return 1;
                    return 0;
                 }],
                ['eIsDeleted', 'is_deleted'], 'call_logs'
            ],
            default_values: {
                'call_logs' : [],
                'is_archived' : 0,
                'is_deleted' : 0
            },
            filter_less_function : function(item){
                if(item['eIsArchived']) customized_keys['archive_count']++;
            },
            custom_function : function(result_row, item){

                result_row['custom_fields'] = util.jsonParseSync(item["eFormLinkedDetails"])? util.jsonParseSync(item["eFormLinkedDetails"]) : [];

            },
            custom_count_fetch : [{
                key : 'status',
                criteria : STATUS_CODE.NOTIFICATION.Unread,
                alias : 'total_unread_notification_count'
            }],
            search_keyword : {
                value : keywords || null,
                filter_keys : ['ePhone', 'eEmail', 'eFirstName', {
                    'eFormLinkedDetails' : {
                         '$jsonArraySearch' : {
                             'search_key' : 'value',
                             'search_value' : keywords
                         }
                     }}
                 ]
            },
            condition : condition_filter,
            has_parent_condition : true,
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
                    parent : true,
                    values : [['dDisplayName', 'domain_name'], ['dID', 'domain_id']]
                },
                {
                    table_name : dao.TABLE_RECORD.FORM,
                    parent : true,
                    condition :  {
                       'users' : {
                           '$contains' : user_id
                       }
                    },
                    values : [['dfName', 'form_name'],  ['dfID', 'form_id']]
                },
                {
                    table_name : dao.TABLE_RECORD.CALL_LOG,
                    unlink: true,
                    custom_function : function(result_row, item){

                        if(!result_row['call_logs'][0]){
                             result_row['call_logs'] = [{
                                  'id' : item['clID'],
                                  'status' : item['clStatus'],
                                  'note' : item['clNote'],
                                  'created_at' : util.formatDate(item['clCreatedAt']),
                                  'updated_at' : util.formatDate(item['clUpdatedAt']),
                                  'user_details' : item['clUserDetails']
                            }]
                        }

                        if(result_row['call_logs'][0] && moment(result_row['call_logs'][0]['updated_at']) < moment(item['clUpdatedAt'])){
                            result_row['call_logs'] = [{
                              'id' : item['clID'],
                              'status' : STATUS_CODE.CALL_LOG[item['clStatus']],
                              'note' : item['clNote'],
                              'created_at' : util.formatDate(item['clCreatedAt']),
                              'updated_at' : util.formatDate(item['clUpdatedAt']),
                              'user_details' : item['clUserDetails']
                            }]
                        }

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
    [
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
        default_values: {
            type : 'call_log'
        },
        values : [  'type', ['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at', function(column){
                   return util.formatDate(column)
                 }], ['clUpdatedAt', 'updated_at', function(column){
                  return util.formatDate(column)
                }],
                ['clStatus', 'status',  STATUS_CODE.CALL_LOG], ['clNote', 'note']
        ]
    },
    {
            table_name : dao.TABLE_RECORD.ENQUIRY_NOTE,
            alias : 'notes',
            default_values: {
                type : 'note'
            },
            values : [  'type', ['nID', 'id'], ['nUserDetails', 'user_details'], ['nCreatedAt', 'created_at', function(column){
                       return util.formatDate(column)
                     }], ['nUpdatedAt', 'updated_at', function(column){
                      return util.formatDate(column)
                    }], ['nNote', 'note']
            ]
    }],
    {
        values : [
            ['eID', 'id'], ['eFirstName', 'first_name'], ['ePhone', 'phone'], ['eEmail', 'email'],
            ['eCreatedAt', 'created_at', function(column){
                return util.formatDate(column)
            }], ['eStatus', 'status', STATUS_CODE.NOTIFICATION], ['eIsArchived', 'is_archived', function(column){
                if(column) return 1;
                return 0;
             }],
            ['eIsDeleted', 'is_deleted', function(column){
               if(column) return 1;
               return 0;
            }], 'custom_fields', 'call_logs', 'notes'
        ],
        default_values: {
            'call_logs' : [],
            'notes' : [],
            'is_archived' : 0,
            'is_deleted' : 0
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
        result['history'] = _.orderBy(_.concat(result['call_logs'], result['notes']), ['updated_at'], ['desc']);
        result['call_logs'] = _.orderBy(_.concat(result['call_logs'], result['notes']), ['updated_at'], ['desc']);
        delete result['notes'];
        //delete result['call_logs'];//Depreacte the Key, once a discussion is done with the App team
        callback(null, result);

    });

};

/**
    *Function associated with Registering a enquiry in the System
    *@todo Remove Data Mocks associated with the Notifications API
*/
exports.addNotification = function(data, callback){

    dao.putData({
    }, dao.TABLE_RECORD.ENQUIRY, Object.assign({
            //Currently, the data is mocked till the functionality is available
            "pID":"B19VQme1X",
            "sID":"ryviBmx1m",
            "dID":"S1EZJJ1x7",
            "dCreatedByUID":"S1XGA00J7",
            "dfID":"SJgVWJJklm",
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
    }, data), function(err, result){

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
        call_log_pre_check : function(callback){

            dao.getOneIndexIterator(dao.TABLE_RECORD.CALL_LOG, "eID", notification_id || null,
                [], {
                   sort_by : {
                       key : 'clUpdatedAt',
                       order : 'desc'
                   }
            }, function(err, result){

                if(err) return callback(err);
                //If the time difference is less than 10 minutes than do not allow to register the call log
                if(result['clStatus'] === 'Engaged' && moment().utc().diff(result.clUpdatedAt, 'seconds') <= 600){
                    return callback({
                        is_previously_engaged : true,
                        success : 0,
                        time_to_call : parseFloat (((600 - moment().utc().diff(result.clUpdatedAt, 'seconds'))/60).toFixed(2)),
                        call_log : {
                            id: result.clID,
                            status: STATUS_CODE.CALL_LOG['Engaged'],
                            created_at: util.formatDate(result.clCreatedAt),
                            updated_at: util.formatDate(result.clUpdatedAt),
                            user_details: result.clUserDetails
                        }

                    })
                }else callback(null, {
                    is_previously_engaged : false
                })

            });

        },
        fetch_calling_user_details : ['call_log_pre_check', function(results, callback){

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

        }],
        create_call_log : ['fetch_calling_user_details', function(results, callback){

            var call_log_id = shortid.generate(), call_log_data = {
              clID : call_log_id,
              clStatus : data.status && (_.invert(STATUS_CODE.CALL_LOG))[data.status] || "Engaged",
              clCreatedAt : moment.utc().format(),
              clUpdatedAt : moment.utc().format(),
              clUserDetails : results.fetch_calling_user_details || {},
              clNote : data.note || null
            }, response_send_data = {
                id: call_log_id,
                status: parseInt(data.status),
                created_at: util.formatDate(call_log_data.clCreatedAt),
                updated_at: util.formatDate(call_log_data.clUpdatedAt),
                user_details: call_log_data.clUserDetails
            };
            dao.updateChildIndexIterator(dao.TABLE_RECORD.ENQUIRY,
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null,
            [ {
                 table_name : dao.TABLE_RECORD.CALL_LOG,
                 create : true,
                 data : call_log_data
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
                callback(err, {
                    "call_log" : response_send_data,
                    "is_previously_engaged": false
                });

            })

        }]
    }, function(err, results){

        if(err) {
            if(err.is_previously_engaged){
                return callback(null, err)
            }
            console.error(message.error.default_error_prefix, err);
            return callback({
            code : err.code || message.code.custom_bad_request,
            message : err.message || message.error.internal_server_error
            })
        }
        callback(null, results.create_call_log);

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
        dao.updateDataIndexIterator(dao.TABLE_RECORD.ENQUIRY,
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null, data.status? {
                eStatus : data.status && (_.invert(STATUS_CODE.NOTIFICATION))[data.status]
            }:{},
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

/**
*   Function to add notes to be associated with a notification
*/
exports.addNotificationNote = function(user_id, notification_id, data, callback){

    if(!notification_id || notification_id === undefined){
        callback({
            code : message.code.bad_request,
            message : message.error.notification.missing_id
        })
    }
    async.auto({
        fetch_user_details : function(callback){

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
        create_note : ['fetch_user_details', function(results, callback){

            var note_log_id = shortid.generate(), note_data = {
              nID : note_log_id,
              nCreatedAt : moment.utc().format(),
              nUpdatedAt : moment.utc().format(),
              nUserDetails : results.fetch_user_details || {},
              nNote : data.note || null
            }, response_send_data = {
                id: note_log_id,
                note : note_data.nNote || null,
                created_at: util.formatDate(note_data.nCreatedAt),
                updated_at: util.formatDate(note_data.nUpdatedAt),
                user_details: note_data.nUserDetails
            };
            dao.updateChildIndexIterator(dao.TABLE_RECORD.ENQUIRY,
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            notification_id || null,
            [ {
                 table_name : dao.TABLE_RECORD.ENQUIRY_NOTE,
                 create : true,
                 data : note_data
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
                callback(err, {
                    "note" : response_send_data
                });

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
        callback(null, results.create_note);

    });

};