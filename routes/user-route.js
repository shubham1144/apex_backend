var express = require('express'),
    router = express.Router(),
    user_controller = require('./../controllers/user-controller.js');


router.get('/user', user_controller.fetchUser);

router.post('/user', user_controller.addUser);

router.post('/user/edit', user_controller.editUser);

router.get('/activate_account', user_controller.validateUser);


module.exports = router;