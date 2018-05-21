/**
* Plans will be Subscription Packages provided by The Platform to Clients
* Users will Be Subscribing to plans.
* a Plan will have a Admin User Associated
* @module Plans
*/
var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js')
/**
* API Interface to create a Plan in the System
*/
router.post('/plans', function(req, res){

    dao.createDataWithChild('Plans', null, {
        pID : 1,
        pName : 'Starter Test 01',
        pDescription : 'For Startup Wanting to Try Out for a Limited Period Of time',
        pActive : true,
        pPrice : 250,
        pDetails : {
            UserCount: 1,
            allowedPing: false,
            DomainCount: 1
        }
    }, null, function(err){
            res.send(err);
    })

});

module.exports = router;