var express = require('express'),
    router = express.Router(),
    domain_controller = require('./../controllers/domain-controller.js');


router.get('/domains', domain_controller.fetchDomains);

router.post('/domains', domain_controller.addDomain);


module.exports = router;