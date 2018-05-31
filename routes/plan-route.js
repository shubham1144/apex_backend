var express = require('express'),
    router = express.Router(),
    plan_controller = require('./../controllers/plan-controller.js');


router.post('/plans', plan_controller.addPlan);


module.exports = router;