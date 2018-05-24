var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    shortid = require('shortid');

/*API Interface to fetch a list of notifications associated with the Platform*/
router.get('/notifications', function(req, res){

    dao.getMultipleDataWithChildByIteration('Plans.Subscriptions.Domains.Forms.Enquiry', {
    }, {
        values : [
            ['pID', 'id'], ['ePhone', 'phone'], ['eEmail', 'email'], ['dID', 'domain_id'],
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

router.get('/notifications/:notification_id', function(req, res){

    /*Mocking Data till the functionality is Available*/
     res.json({
                 "success": true,
                 "data": {
                     "id": "47",
                     "firstname": "Zahid",
                     "lastname": null,
                     "message": "Notify ME - test message. please ignore",
                     "email": "zahid@tentwenty.me",
                     "phone": "0568318060",
                     "subject": "Website Development",
                     "company": 'Test Client Company',
                     "domain_id": "3",
                     "domain_name": "TenTwenty Test",
                     "form_id": "3",
                     "form_name": "Enquiry Form",
                     "created_at": "2018-05-03 17:20:02",
                     "priority": "0",
                     "status": "1",
                     "is_archived": "0",
                     "is_deleted": "0",
                     "call_logs": [
                         {
                             "id": "127",
                             "status": "2",
                             "firstname": "Syed",
                             "lastname": "Shah hashmi",
                             "created_at": "2018-05-07 10:36:58",
                             "user_id": "3",
                             "user_contact": "+93 76 443 2073",
                             "note": ""
                         }
                     ]
                 }
             })

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