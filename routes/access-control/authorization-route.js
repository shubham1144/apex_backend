var express = require('express'),
    router = express.Router(),
    authorization = require('./../../controllers/access-control/authorization-controller.js'),
    payload_validator = require('./../../helpers/payload_validator.js'),
    message = require('./../../helpers/message.json')
    util = require('./../../helpers/util.js')
    dao = require('./../../dao/dao.js');

/**
* Api Interface for fetching User Credentials and authenticating the user
* @todo : Need to Move the Business Logic to Sevices Layer
* @todo : Need to Hash the password being used with BCRYPT
* @todo : Need to Integrate JWT
*/
router.post('/login', function(req, res) {

    var required_keys = ['uEmail', 'uPassword', 'deviceType', 'deviceToken'];
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("uEmail") || err.missing_keys.includes("uPassword")){
               return util.formatErrorResponse(0, message.error.login.email_password_missing, function(err){
                    res.status(400).send(err);
               })
            }
            else if(err.missing_keys.includes("deviceType")){
                return util.formatErrorResponse(0, message.error.login.device_type_missing, function(err){
                                    res.status(400).send(err);
                               })
            }
            else if(err.missing_keys.includes("deviceToken")){
                            return util.formatErrorResponse(0, message.error.login.device_token_missing, function(err){
                                                res.status(400).send(err);
                                           })
                        }
            else return util.formatErrorResponse(0, message.error.bad_request, function(err){
                res.status(400).send(err)
            })
        }

        dao.getDataWithChildByIteration('Users', {
            uEmail : req.body.uEmail
        }, ['Users.UserDevices', 'Users.UserAttributes'], function(err, result){

            if(err) return res.status(500).send("Internal Server Error");
            console.log("The data received from Store Is : ", result);
            if(req.body.uPassword !== result.uPassword){
                return util.formatErrorResponse(0, message.error.login.invalid_credentials, function(err){
                    res.status(400).send(err);
                })
            }

            util.formatSuccessResponse({
                    "msg": message.success.login.success,
                    "total_unread_notification_count": 0,
                    "user_info": {
                        "last_name": result.uLastName,
                        "first_name": result.uFirstName,
                        "user_id": result.uID,
                        "avatar": "http://localhost/notify.me/files/avatars/1.jpg",//HardCoded for Now
                    },
                    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJub3RpZnkuYWUiLCJhdWQiOiJ0ZW50d2VudHkuY29tIiwianRpIjoieVlkdzlEVXNFazU1U3FSSiIsImlhdCI6MTUyNjUzNjk2OSwibmJmIjoxNTI2NTM2OTY5LCJleHAiOjE1NTgwNzI5NjksInVzZXJfaWQiOiIyIn0.axLozJtcTD8Ug0SrPC5to8WG6JyRjW1wy5hPqVWXSUo"
            }, function(result){
                res.json(result);
            })

        })

    });

});


module.exports = router;