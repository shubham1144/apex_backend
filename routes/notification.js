var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    shortid = require('shortid'),
    moment = require('moment'),
    _ = require('lodash'),
    payload_validator = require('./../helpers/payload_validator.js'),
    async = require('async');
var userService = require('./../services/user-service.js');

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

}


/**
    * API Interface to fetch a list of notifications associated with the Platform
*/
router.get('/notifications', function(req, res){

        var condition_filter = {};

        if(req.query.archieve){
            condition_filter = Object.assign(condition_filter, {
                'eIsArchived' : {
                    '$equals' : req.query.archieve === '1' ? true : false
                }
            })
        }
        if(req.query.status){

            var status_filter = [],
                status_preprocess_list = req.query.status && req.query.status !== undefined && req.query.status.split(",");

            status_preprocess_list && status_preprocess_list.forEach(function(key){

                if(_.invert(STATUS_CODE.NOTIFICATION)[key] !== undefined) status_filter.push(_.invert(STATUS_CODE.NOTIFICATION)[key]);

            })
            condition_filter = Object.assign(condition_filter, {
                'eStatus' : {
                    '$equalsAny' : status_filter
                }
            })
        }
        console.log("The Filter Associated with the Status is : ", condition_filter)
        dao.getMultipleTableIterator('Plans.Subscriptions.Domains.Forms.Enquiry', {
        }, {
            page : req.query.page || 1,
            parent_index_filter : req.query.form_id ? {
                                        table_name : 'Plans.Subscriptions.Domains.Forms',
                                        index : 'dfID',
                                        value : req.query.form_id,
                                        message : "Form Id Not Found"
                                  } :
                                  req.query.domain_id? {
                                        table_name : 'Plans.Subscriptions.Domains',
                                        index : 'dID',
                                        value : req.query.domain_id,
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
                criteria : 0,
                alias : 'total_unread_notification_count'
            }],
            search_keyword : {
                value : req.query.keywords || null,
                filter_keys : ['ePhone', 'eEmail']
            },
            condition : condition_filter,
            sort_by : {
                key : 'status',
                order : [3, 0, 2, 1]
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
                    values : [['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clUpdatedAt', 'updated_at'], ['clStatus', 'status', STATUS_CODE.CALL_LOG], ['clNote', 'note']]
                }
        ],
        function(err, result, requested_count_details){

            if(err) {
                console.error("Error occured due to : ", err);
                return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error', function(err){
                    res.send(err);
                })
            }

            util.formatSuccessResponseStandard(res.locals, Object.assign(requested_count_details || {}, {
               notifications : result
           }), function(result){
                res.send(result);
            })

        });

});

/**
    * API Interface to fetch Status Codes associated with the Application
    *@TODO : The same is not being used yet, Once we reach a scalable phase, we can change the Client Side Logic to customized values for statuses.
*/
router.get('/notifications/status_codes', function(req, res){

    if(req.query.type && req.query.type === 'call_log'){
         util.formatSuccessResponseStandard(res.locals, { status : STATUS_CODE.CALL_LOG } , function(result){
            res.send(result);
         })
    }else {
          util.formatSuccessResponseStandard(res.locals, { status : STATUS_CODE.NOTIFICATION }, function(result){
            res.send(result);
          })
    }

});

/**
    *API to fetch Details associated with  Enquiry Notification Details
*/
router.get('/notifications/:notification_id', function(req, res){

    dao.getOneIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry', "eID", req.params.notification_id || null,
    [{
            table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
            alias : 'call_logs',
            values : [['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clUpdatedAt', 'updated_at'], ['clStatus', 'status',  STATUS_CODE.CALL_LOG], ['clNote', 'note']
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
                        console.error("Error occured due to : ", err);
                        return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error', function(err){
                            res.send(err);
                        })
        }
        util.formatSuccessResponseStandard(res.locals, result, function(result){
            res.send(result);
        })
    });

});

/**
    *API Interface associated with Registering a enquiry in the System
    *@todo : Remove Data Mocks associated with the Notifications API
*/
router.post('/notifications', function(req, res){

    //@todo : Need to fetch the Details Associated with (Plan and The Subscription Associated and Domain and the form )with the DomainKey Received
    dao.putData({
    }, 'Plans.Subscriptions.Domains.Forms.Enquiry', {
    "pID":"B19VQme1X","sID":"ryviBmx1m","dID":"r1Hn91EyX","dCreatedByUID":"r1UH8Of1m","dfID":"HyxH391EkQ",
    "eID" : shortid.generate(),
            ePhone : '8975567457',
            eEmail : 'testuser10@tentwenty.me',
            eFormAllDetails : "",
            eStatus : 'Unread',
            eCreatedAt : moment.utc().format(),
            eUpdatedAt : moment.utc().format(),
            eIsArchived : false,
            eIsDeleted : false
    }, function(err, result){
        if(err) return res.send("Database Error");
        res.send("Mock Notification Captured")
    });

})


/**
    * API Interface to update Call Logs associated with Enquiry
*/
router.post('/notifications/:notification_id/call_logs', function(req, res){

    if(!req.params.notification_id || req.params.notification_id === undefined){
        return util.formatErrorResponse(400, 'notification_id not provided', function(err){
            res.send(err);
        })
    }
    async.auto({
        fetch_calling_user_details : function(callback){

            userService.fetchUserDetails(req.user.user_id, function(err, result){
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
            req.params.notification_id || null,
            [ {
                 table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
                 create : true,
                 data : {
                     clID : call_log_id,
                     clStatus : req.body.status && (_.invert(STATUS_CODE.CALL_LOG))[req.body.status] || "NotCalled",
                     clCreatedAt : moment.utc().format(),
                     clUpdatedAt : moment.utc().format(),
                     clUserDetails : results.fetch_calling_user_details || {},
                     clNote : req.body.note || null
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
            console.error("Error occured due to : ", err);
            return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error',
            function(err){
                res.send(err);
            })
        }
        util.formatSuccessResponse({
            msg: 'Call Log has been generated Successfully',
            id : results.create_call_log
        }, function(result){
            res.json(result);
        })

    });

});


/**
    * API Interface to Update the Details associated with an Existing Call Log
*/
router.put('/notifications/:notification_id/call_logs', function(req, res){

    if(!req.params.notification_id || req.params.notification_id === undefined){
        return util.formatErrorResponse(400, 'notification_id not provided', function(err){
            res.send(err);
        })
    }
    var required_keys = ['call_log_id', 'status', 'note'];
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("call_log_id")){
                 return util.formatErrorResponse(0, 'Please Provide call_log_id', function(err){
                    res.send(err);
                })
            }
        }
        dao.updateChildIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry',
            ['pID', 'sID', 'dID', 'dCreatedByUID', 'dfID', 'eID'], 'eID',
            req.params.notification_id || null,
            [ {
                 table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
                 condition : {
                    'clID' : {
                        '$equals' :  req.body.call_log_id
                    }
                 },
                 data : {
                     clStatus : req.body.status && (_.invert(STATUS_CODE.CALL_LOG))[req.body.status] || "NotCalled",
                     clUpdatedAt : moment.utc().format(),
                     clNote : req.body.note || null
                 }
             }],
            function(err){

                if(err) {
                    console.error("Error occured due to : ", err);
                    return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error',
                    function(err){
                    res.send(err);
                    })
                }
                util.formatSuccessResponse({
                    msg: 'Call Log has been updated Successfully',
                }, function(result){
                res.json(result);
                })
            })
        });


});


module.exports = router;