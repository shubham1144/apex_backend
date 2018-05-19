var express = require('express'),
    router = express.Router(),
    authorization = require('./../../controllers/access-control/authorization-controller.js'),
    payload_validator = require('./../../helpers/payload_validator.js'),
    message = require('./../../helpers/message.json')
    util = require('./../../helpers/util.js'),
    dao = require('./../../dao/dao.js'),
    token = require('./../../helpers/token.js')
    bcrypt = require('bcrypt'),
    _ = require('lodash');
var device_types = ['android', 'ios'];


/**
* Api Interface for fetching User Credentials and authenticating the user
* @todo : Need to Move the Business Logic to Services Layer
*/
router.post('/login', function(req, res) {

    var required_keys = ['uEmail', 'uPassword', 'deviceType', 'deviceToken'];
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("uEmail") || err.missing_keys.includes("uPassword")){
               return util.formatErrorResponse(0, message.error.login.email_password_missing, function(err){
                    res.send(err);
               })
            }
            else if(err.missing_keys.includes("deviceType")){
                return util.formatErrorResponse(0, message.error.login.device_type_missing, function(err){
                    res.send(err);
                })
            }
            else if(err.missing_keys.includes("deviceToken")){
                            return util.formatErrorResponse(0, message.error.login.device_token_missing, function(err){
                                                res.send(err);
                                           })
                        }
            else return util.formatErrorResponse(0, message.error.bad_request, function(err){
                res.send(err)
            })
        }

        if(!_.includes(device_types, req.body.deviceType)) return util.formatErrorResponse(0, message.error.login.device_type_missing, function(err){
             res.send(err);
         })
        dao.getDataWithChildByIteration('Users', {
            uEmail : req.body.uEmail
        }, [], function(err, result){

            if(err){
                console.error("Error occured due to : ", err);
                return res.status(500).send("Internal Server Error");
            }
            if(!result || result === undefined || Object.keys(result).length <1) return util.formatErrorResponse(0, message.error.login.invalid_credentials, function(err){
                res.send(err);
            })
            bcrypt.compare(req.body.uPassword, result.uPassword, function(err, validation_status){
                if(!validation_status) return util.formatErrorResponse(0, message.error.login.invalid_credentials, function(err){
                    res.send(err);
                })
                token.signAndGenerateToken({
                    user_id : result.uID
                }, function(err, token){

                    util.formatSuccessResponse({
                        msg: message.success.login.success,
                        total_unread_notification_count: 0,//HardCoded for Now, till work gets started on the notifications
                        user_info: {
                            last_name: result.uLastName,
                            first_name: result.uFirstName,
                            user_id: result.uID,
                            avatar: "http://localhost/notify.me/files/avatars/1.jpg",//HardCoded for Now
                        },
                        token: token
                    }, function(result){
                        res.json(result);
                    })

                })

            })

        })

    });

});


module.exports = router;