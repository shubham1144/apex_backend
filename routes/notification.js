var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    shortid = require('shortid');

/**
    * API Interface to fetch a list of notifications associated with the Platform
*/
router.get('/notifications', function(req, res){

    dao.getMultipleDataWithChildByIteration('Plans.Subscriptions.Domains.Forms.Enquiry', {
    }, {
        values : [
            ['eID', 'id'], ['ePhone', 'phone'], ['eEmail', 'email'], ['dID', 'domain_id'],
            ['dfID', 'form_id'], ['eCreatedAt', 'created_at'], ['eStatus', 'status'], ['eIsArchived', 'is_archived'],
            ['eIsDeleted', 'is_deleted'], 'custom_fields', 'call_logs'
        ]
    }, [{
        table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
        alias : 'call_logs',
        values : [['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clStatus', 'status'], ['clNote', 'note']]
       }],
    function(err, result, requested_count_details){

        if(err) return res.send("Database Error");

        return util.formatSuccessResponse( Object.assign(requested_count_details, {
            notifications : result,
        }), function(result){
            res.send(result);
        })

    })

});

/**
    *API to fetch Details associated with  Enquiry Notification Details
*/
router.get('/notifications/:notification_id', function(req, res){

    dao.getOneIndexIterator('Plans.Subscriptions.Domains.Forms.Enquiry', "eID", req.params.notification_id || null,
    [{
            table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
            alias : 'call_logs',
            values : [['clID', 'id'], ['clUserDetails', 'user_details'], ['clCreatedAt', 'created_at'], ['clStatus', 'status'], ['clNote', 'note']]
    }],
    {
        values : [
            ['pID', 'id'], ['ePhone', 'phone'], ['eEmail', 'email'], ['dID', 'domain_id'], 'domain_name',
            ['dfID', 'form_id'], 'form_name', ['eCreatedAt', 'created_at'], ['eStatus', 'status'], ['eIsArchived', 'is_archived'],
            ['eIsDeleted', 'is_deleted'], 'custom_fields', 'call_logs'
        ]
    }, function(err, result){
        if(err) return res.send("Database Error");
        return util.formatSuccessResponse(result, function(result){
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
    "pID":"B19VQme1X","sID":"ryviBmx1m","dID":"r1Hn91EyX","dCreatedByUID":"r1UH8Of1m","dfID":"HyxH391EkQ","eID":"SkhmUxVkQ",
    clID : shortid.generate(),
    clStatus : "0",
    clUserDetails : {
        firstname : 'Shubham',
        lastname : 'Chodankar',
        user_id : 'X',
        user_contact : '8975567457'
    },
    clNote : "Testing Creation of a Note using a Enquiry"
    }, function(err, result){
         if(err) return res.send("Database Error");
         res.send("Mock Call Log Captured Against a Enquiry")
     })

});

module.exports = router;