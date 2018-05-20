/**
* Business Logic Associated with Operations associated with Application User Details
* @module User
*/

var express = require('express'),
    router = express.Router();

/**
* API Interface to fetch Details associated with a User Profile
*/
router.get('/user', function(req, res){
    /*Mocking Data till the functionality is working*/
    res.json({
                     "succcess": true,
                     "data": {
                         "user_id": "1",
                         "avatar": "http://notify-me.1020dev.com/files/avatars/2.jpg?1526798952",
                         "lastname": "Singh gulayh",
                         "firstname": "Amit",
                         "email": "shubham@tentwenty.me",
                         "contact": "+9718975567457",
                         "is_notification": "0",
                         "total_unread_notification_count": 0
                     }
     });

})

module.exports = router;