/**
* Business Logic Associated with Operations associated with Application User Details
* @module User
*/

var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    environment = process.env.NODE_ENV && process.env.NODE_ENV!== undefined? process.env.NODE_ENV :  'local',
    config = require('./../config/config.js'),
    moment = require('moment');

/**
* API Interface to fetch Details associated with a User Profile
*/
router.get('/user', function(req, res){

    dao.getOneByIteration('Users', {
        uID : req.user.user_id
    }, [{
            table_name : 'Users.UserAttributes',
            values : ['uaKey', 'uaValue']
    }], {
        values : [['uID', 'user_id'], ['uLastName', 'lastname'], ['uFirstName', 'firstname'], ['uEmail', 'email']]
    }, function(err, result){

        if(err) return res.send("Database Error")

        Object.assign(result, {
            avatar: config[environment].static_file_path + result.user_id + ".jpg?" + moment().unix(),
            contact : _.filter(result['Users.UserAttributes'] && result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0] ?
               _.filter(result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0]['uaValue'] : null,
            is_notification: "0",
            total_unread_notification_count: 0,
        });
        delete result['Users.UserAttributes'];
        util.formatSuccessResponse(result, function(result){
             return res.json(result);
        })

    });

})

module.exports = router;