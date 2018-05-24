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
                ['eIsDeleted', 'is_deleted']
        ]
    }, [{
                   table_name : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',
                   alias : 'call_logs'
//                   values : ['uaKey', 'uaValue']
           }], function(err, result, requested_count_details){
        if(err) return res.send("Database Error");

        return util.formatSuccessResponse( Object.assign(requested_count_details, {
                                                      notifications : result,
                                                  }), function(result){
                       res.send(result);
                   })
    })

    /*Mocking the Data for now, till the Application is functional*/
    return;
    res.json({
                 "success": true,
                 "data": {
                     "total_unread_notification_count": 0,
                     "archive_count": 6,
                     "notifications": [
                         {
                                                                        "id": "47",
                             "firstname": "Zahid",
                             "lastname": null,
                             "message": "test message please ignore",
                             "email": "zahid@tentwenty.me",
                                                                        "phone": "0568318060",
                             "subject": "Website Development",
                             "company": null,
                                                                        "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                                                                        "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-05-03 17:20:02",
                                                                         "priority": "0",
                                                                         "status": "3",
                                                                         "is_archived": "0",
                                                                         "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "127",
                                     "status": "3",
                                     "firstname": "Syed",
                                     "lastname": "Shah hashmi",
                                     "created_at": "2018-05-07 10:36:58",
                                     "user_id": "3",
                                     "user_contact": "+93 76 443 2073",
                                     "note": ""
                                 }
                             ]
                         },
                         {
                             "id": "43",
                             "firstname": "Idris Khozema",
                             "lastname": null,
                             "message": "Testing. Please ignore it.",
                             "email": "idris@tentwenty.me",
                             "phone": "058 2674953",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-04-30 10:33:38",
                             "priority": "0",
                             "status": "3",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "128",
                                     "status": "3",
                                     "firstname": "Syed",
                                     "lastname": "Shah hashmi",
                                     "created_at": "2018-05-10 10:13:00",
                                     "user_id": "3",
                                     "user_contact": "+93 76 443 2073",
                                     "note": ""
                                 }
                             ]
                         },
                         {
                             "id": "46",
                             "firstname": "Idris Khozema07",
                             "lastname": null,
                             "message": "Android Testing 07. Please ignore it",
                             "email": "idris@tentwenty.me",
                             "phone": "0582674953",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-05-02 10:41:02",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "122",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-02 11:06:42",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "45",
                             "firstname": "Idris Khozema06",
                             "lastname": null,
                             "message": "Android Testing 06. Please ignore it",
                             "email": "idris@tentwenty.me",
                             "phone": "0582674953",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-05-02 10:40:04",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "123",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-02 11:07:22",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "44",
                             "firstname": "Idris Khozema05",
                             "lastname": null,
                             "message": "Android Testing. Please ignore it",
                             "email": "idris@tentwenty.me",
                             "phone": "0582674953",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-05-02 10:38:31",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "124",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-02 11:07:41",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "41",
                             "firstname": "Khushal",
                             "lastname": null,
                             "message": "Testing message new 05",
                             "email": "khushal@tentwenty.me",
                             "phone": "12345678",
                             "subject": "Website Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-04-04 17:34:53",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "125",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-02 11:08:04",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "40",
                             "firstname": "Farhan",
                             "lastname": null,
                             "message": "Testing message new 04",
                             "email": "farhan@tentwenty.me",
                             "phone": "12345678",
                             "subject": "Website Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-04-04 15:50:35",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "117",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-02 10:35:41",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "39",
                             "firstname": "Idris Khozema",
                             "lastname": null,
                             "message": "Testing message new 02",
                             "email": "idris@tentwenty.me",
                             "phone": "12345678",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-04-04 15:39:15",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "118",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-02 10:36:14",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "38",
                             "firstname": "Idris Khozema",
                             "lastname": null,
                             "message": "Testing message new",
                             "email": "idris@tentwenty.me",
                             "phone": "12345678",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-04-04 15:36:42",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "115",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-01 16:30:28",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         },
                         {
                             "id": "37",
                             "firstname": "Idris Khozema",
                             "lastname": null,
                             "message": "Testing message",
                             "email": "idris@tentwenty.me",
                             "phone": "12345678",
                             "subject": "App Development",
                             "company": null,
                             "domain_id": "3",
                             "domain_name": "TenTwenty Test",
                             "form_id": "3",
                             "form_name": "Enquiry Form",
                             "created_at": "2018-04-04 15:09:07",
                             "priority": "0",
                             "status": "1",
                             "is_archived": "0",
                             "is_deleted": "0",
                             "call_logs": [
                                 {
                                     "id": "106",
                                     "status": "1",
                                     "firstname": "ldris",
                                     "lastname": "khozema",
                                     "created_at": "2018-05-01 16:16:13",
                                     "user_id": "4",
                                     "user_contact": "234567896",
                                     "note": "Busy"
                                 }
                             ]
                         }
                     ]
                 }
             });

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
        res.send("Notification Captured")
    });

})

/**
 * API Interface to update Call Logs associated with Enquiry
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
         res.send("Call Log Captured Against a Enquiry")
     })

});

module.exports = router;