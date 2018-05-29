var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    shortid = require('shortid'),
    moment = require('moment'),
    async = require('async');


/**
    * API Interface to fetch a list of notifications associated with the Platform
*/
router.get('/notifications', function(req, res){

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
                ['eID', 'id'], ['ePhone', 'phone'], ['eEmail', 'email'],
                ['eCreatedAt', 'created_at'], ['eStatus', 'status', {
                    'Unread' : 0,
                    'Read' : 1,
                    'NotReachable' : 2,
                    'Engaged' : 3
                }], ['eIsArchived', 'is_archived'],
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
            condition : (req.query.archieve)?{
                'eIsArchived' : {
                    '$equals' : req.query.archieve === '1' ? true : false
                }
            } : null,
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
                    values : [['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clStatus', 'status', {
                        'NotCalled' : 0,
                        'Called' : 1,
                        'Engaged' : 3,
                        'NotReachable' : 2
                    }], ['clNote', 'note']]
                }
        ],
        function(err, result, requested_count_details){
            console.log("The Requested Count Details Obtained are : ", requested_count_details);
            if(err) {
                console.error("Error occured due to : ", err);
                return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error', function(err){
                    res.send(err);
                })
            }
            util.formatSuccessResponseStandard(res.locals, Object.assign(requested_count_details, {
               notifications : result
           }), function(result){
                res.send(result);
            })


        });

});

/**
    *API to fetch Details associated with  Enquiry Notification Details
*/
router.get('/notifications/:notification_id', function(req, res){

    dao.getOneIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry', "eID", req.params.notification_id || null,
    [{
            table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
            alias : 'call_logs',
            values : [['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clStatus', 'status', {
                            'NotCalled' : 0,
                            'Called' : 1,
                            'Engaged' : 3,
                            'NotReachable' : 2
                    }], ['clNote', 'note']
    ]
    }],
    {
        values : [
            ['pID', 'id'], ['ePhone', 'phone'], ['eEmail', 'email'], ['dID', 'domain_id'], 'domain_name',
            ['dfID', 'form_id'], 'form_name', ['eCreatedAt', 'created_at'], ['eStatus', 'status', {
                                                                                                                      'Unread' : 0,
                                                                                                                      'Read' : 1,
                                                                                                                      'NotReachable' : 2,
                                                                                                                      'Engaged' : 3
                                                                                                                  }], ['eIsArchived', 'is_archived'],
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
            eIsArchived : false,
            eIsDeleted : false
    }, function(err, result){
        if(err) return res.send("Database Error");
        res.send("Mock Notification Captured")
    });

})

/**
    * API Interface to update Call Logs associated with Enquiry
    *@todo : Remove Data Mocks associated with the Notifications Call Logs API
*/
router.post('/notifications/call_logs', function(req, res){

    dao.putData({}, 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs', {
    "pID":"B19VQme1X","sID":"ryviBmx1m","dID":"r1Hn91EyX","dCreatedByUID":"r1UH8Of1m","dfID":"HyxH391EkQ","eID": req.query.eID,
    clID : shortid.generate(),
    clStatus : "NotCalled",
    clCreatedAt : moment.utc().format(),
    clUserDetails : {
        firstname : 'Shubham',
        lastname : 'Chodankar',
        user_id : 'rJfFCcb1X',
        user_contact : '+91 8975567457'
    },
    clNote : "Testing Creation of a Note using a Enquiry"
    }, function(err, result){
         if(err) return res.send("Database Error");
         res.send("Mock Call Log Captured Against a Enquiry")
     })

});

module.exports = router;