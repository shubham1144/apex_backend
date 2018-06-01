var express = require('express'),
    router = express.Router(),
    subscription_controller = require('./../controllers/subscription-controller.js');


router.post('/subscriptions', subscription_controller.addSubscription);


module.exports = router;