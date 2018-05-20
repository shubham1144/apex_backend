/**
* Business Logic Associated with Operations associated with Application User Details
* @module User
*/

var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    environment = process.env.NODE_ENV && process.env.NODE_ENV!== undefined? process.env.NODE_ENV :  'local',
    config = require('./../config/config.js'),
    payload_validator = require('./../helpers/payload_validator.js'),
    moment = require('moment');


function fetchUserDetails(user_id, callback){

    dao.getOneByIteration('Users', {
            'uID' : user_id
            }, [{
            table_name : 'Users.UserAttributes',
            values : ['uaKey', 'uaValue']
    }], {
        values : [['uID', 'user_id'], ['uLastName', 'lastname'], ['uFirstName', 'firstname'], ['uEmail', 'email']]
    }, function(err, result){

        if(err) return callback("Database Error")

        Object.assign(result, {
            avatar: config[environment].static_file_path + result.user_id + ".jpg?" + moment().unix(),
            contact : _.filter(result['Users.UserAttributes'] && result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0] ?
               _.filter(result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0]['uaValue'] : null,
            is_notification: "0",
            total_unread_notification_count: 0,
        });
        delete result['Users.UserAttributes'];
        util.formatSuccessResponse(result, function(result){
             callback(result);
        })

    });

}
/**
* API Interface to fetch Details associated with a User Profile
*/
router.get('/user', function(req, res){

    fetchUserDetails(parseInt(req.user.user_id), function(result){
        res.send(result)
    })

});

/**
* API Interface to update the details associated with a User Profile
* @todo Need to Support Password Updates associated with the User Profile
*/
router.post('/user/edit', function(req, res){

    var required_keys = ['first_name', 'contact', 'is_notification', 'last_name'];//'profile_avatar_img' - key to be added once the image display is functional
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){
         if(err){
                    if(err.missing_keys.includes("first_name")){
                       return util.formatErrorResponse(0, 'Please enter a valid First Name', function(err){
                            res.send(err);
                       })
                    }
         }
     dao.updateDataWithChild('Users', ['uID'], {
        uID : parseInt(req.user.user_id),
        uFirstName : req.body.first_name,
        uLastName : req.body.last_name
     }, [{
        table_name : 'Users.UserAttributes',
        data : {
            "uaKey": "contactNumber",
            "uaValue": req.body.contact
        }
     }], function(err){

       fetchUserDetails(parseInt(req.user.user_id), function(result){
            res.send(result);
       })

     })

    });

});

module.exports = router;