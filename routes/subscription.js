/**
* Subscription will be against Plans provided by The Platform to Clients
* Users(Admin) will Be Subscribing to plan and then there will be Domains associated with the Subscription
* Subscription will be Associated with a User...
* @module Subscriptions
*/
var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js')
/**
* API Interface to create a Plan in the System
*/
router.post('/subscriptions', function(req, res){

    dao.createDataWithChild('Plans.Subscriptions', null, {
        pID : 1,
        sID : 1,
        uID : 1,
        sIsActive : true,
        sParentID : null,
        users : [1]
    }, null, function(err){
        if(err){
            console.error("Error occured due to : ", err);
            return res.status(500).send("Internal Server Error")
        }
        res.send("Subscription Account has been activated");
    })

});

module.exports = router;