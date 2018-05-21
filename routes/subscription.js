/**
* Subscription will be against Plans provided by The Platform to Clients
* Users(Admin) will Be Subscribing to plan and then there will be Domains associated with the Subscription
* Subscription will be Associated with a User...
* @module Subscriptions
*/
var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    shortid = require('shortid');


/**
* API Interface to create a Plan in the System
*/
router.post('/subscriptions', function(req, res){

    dao.createDataWithChild('Plans.Subscriptions', null, {
        pID : 'B19VQme1X',//Using a Default Plan For all the Subscriptions Temporaily
        sID : shortid.generate(),
        uID : req.user.user_id,//For now The Logged in User Will be assocaited with the Subscription
        sIsActive : true,
        sParentID : null,
        users : [req.user.user_id]
    }, null, function(err){
        if(err){
            console.error("Error occured due to : ", err);
            return res.status(500).send("Internal Server Error")
        }
        res.send("Subscription Account has been activated");
    })

});

module.exports = router;