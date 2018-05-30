/**
* Plans will be Subscription Packages provided by The Platform to Clients
* Users will Be Subscribing to plans.
* a Plan will have a Admin User Associated
* @module Plans
*/
var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    shortid = require('shortid'),
    message = require("./../helpers/message.json");


/**
    * API Interface to create a Plan in the System
    *@todo : Work on the api for Registration of Plans in the system
*/
router.post('/plans', function(req, res){

    dao.createDataWithChild('Plans', null, {
        pID : shortid.generate(),
        pName : 'Starter Test 01',
        pDescription : 'For Startup Wanting to Try Out for a Limited Period Of time',
        pActive : true,
        pPrice : 250,
        pDetails : {
            UserCount: 1,
            allowedPing: false,
            DomainCount: 1
        }
    }, null,
    function(err){
        if(err) {
            console.error(message.error.default_error_prefix, err);
            return res.send(message.error.internal_server_error)
        }
        res.send(err + "Mock Plan Registration in the System");
    })

});


module.exports = router;