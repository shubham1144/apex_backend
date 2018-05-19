var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js');
var async = require('async');

router.get('/domains', function(req, res) {

// dao.putDataWithChild('Domains', ['dID', 'dCreatedByUID'], {
//    dID : 2,
//    dCreatedByUID : 1,
//    dDisplayName : 'Test Domain 02',
//    dKey : 'test12345678910',
//    dStatus : true,
//    dVerified : true,
//    dUrl : 'http://tentwenty.me',
//    disPingAllowed : true
//  },
//  [ {
//      table_name : 'Domains.Forms',
//      data : {
//         dfID : 2,
//         dfName : "Test Domain 02 - Form 02",
//      }
//    }
//  ], function(err, callback){
//        if(err) return res.send("Database Error")
//        res.send("Domain has been registered in the system");
//
//  });
    var filter = req.query.domain_id ? {
        dID : req.query.domain_id
    } : {}
    dao.getMultipleDataWithChildByIteration('Domains', {}, [ {
    table_name : 'Domains.Forms',
    alias : 'forms'
    }], function(err, result){
          if(err) return res.send("Database Error")

          var response_data = {
            total_unread_notification_count: 0,
            companies : []
          };

          var mock_data_format = {
            "total_unread_notification_count": 0,
            "companies": [
                {
                "id": "1",
                "title": "Notify Me (Local)",
                "notifications": 0,
                "forms": [
                    {
                    "name": "Contact Us",
                    "id": "1",
                    "no_of_unread_notifications": 0
                    }
                ],
                "enq_count_stats": {},
                "enq_res_time_stats": {}
                }
            ]};

          res.send(result);
    })

});

module.exports = router;