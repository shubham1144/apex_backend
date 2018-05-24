var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    async = require('async'),
    util = require('./../helpers/util.js'),
    shortid = require('shortid');

/**
* API Interface to list all the domains associated with a User in the System
*/
router.get('/domains', function(req, res) {

    var filter = req.query.domain_id ? {
        dID : parseInt(req.query.domain_id)
    } : {}
    dao.getMultipleDataWithChildByIteration('Plans.Subscriptions.Domains', filter, {
        values : [['dID', 'id'], ['dDisplayName', 'title'], 'notifications', 'enq_count_stats', 'enq_res_time_stats']
    },
    [{
        table_name : 'Plans.Subscriptions.Domains.Forms',
        alias : 'forms',
        join_fetch : true,
        condition : {
            'users' : {
                '$contains' : req.user.user_id
            }

        },
        values : [['dfID', 'id'], ['dfName', 'name'], 'no_of_unread_notifications']
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
     var domain_id = shortid.generate(), domain_form_id = shortid.generate();
     dao.createDataWithChild('Plans.Subscriptions.Domains', ['dID', 'dCreatedByUID'], {
        pID : 'B19VQme1X',
        sID : 'ryviBmx1m',
        dID : domain_id,
        dCreatedByUID : req.user.user_id,
        dDisplayName : 'Test Domain 24 May 2018 01' + domain_id ,
        dKey : 'test12345678911',
        dStatus : true,
        dVerified : true,
        dUrl : 'http://tentwenty.me',
        disPingAllowed : true
      },
      [
       {
          table_name : 'Plans.Subscriptions.Domains.Forms',
          data : {
            pID : 'B19VQme1X',
            sID : 'ryviBmx1m',
            dID : domain_id,
            dfID : domain_form_id,
            dfName : "Test Domain 24 May 2018 01" + domain_id + " - Form 0" + domain_form_id,
            users : [req.user.user_id]
          }
        }
      ], function(err, callback){
            if(err) return res.send("Database Error")
            res.send("Mock Domain has been registered in the system");
    });

});


module.exports = router;