var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    async = require('async'),
    util = require('./../helpers/util.js');

/**
* API Interface to list all the domains associated with a User in the System
* @todo: Fetch only the Domains that are accessible to the User making the Request associated with the Domain
*/
router.get('/domains', function(req, res) {

    var filter = req.query.domain_id ? {
        dID : parseInt(req.query.domain_id)
    } : {}
    dao.getMultipleDataWithChildByIteration('Domains', filter, {
        values : [['dID', 'id'], ['dDisplayName', 'title'], 'notifications', 'enq_count_stats', 'enq_res_time_stats']
    },
    [{
        table_name : 'Domains.Forms',
        alias : 'forms',
        values : [['dID', 'id'], ['dfName', 'name'], 'no_of_unread_notifications']
    }], function(err, result){
            if(err) return res.send("Database Error")
            util.formatSuccessResponse({
                total_unread_notification_count: 0,
                companies : result
            }, function(result){
                 res.json(result);
            })
    })

});

/**
* API Interface to register domains in the Platform
* @todo : Work on the api for registration of a domain in the system
*/
router.post('/domains', function(req, res){

     /*Currently Adding mock Data in the System Till the functionality is Ready and Working*/
     dao.putDataWithChild('Domains', ['dID', 'dCreatedByUID'], {
        dID : 3,
        dCreatedByUID : 1,
        dDisplayName : 'Test Domain 03',
        dKey : 'test12345678911',
        dStatus : true,
        dVerified : true,
        dUrl : 'http://tentwenty.me',
        disPingAllowed : true
      },
      [ {
          table_name : 'Domains.Forms',
          data : {
             dfID : 3,
             dfName : "Test Domain 03 - Form 03",
          }
        }
      ], function(err, callback){
            if(err) return res.send("Database Error")
            res.send("Domain has been registered in the system");
    });

});


module.exports = router;