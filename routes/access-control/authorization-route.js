var express = require('express'),
    router = express.Router(),
    payload_validator = require('./../../helpers/payload_validator.js'),
    message = require('./../../helpers/message.json'),
    util = require('./../../helpers/util.js'),
    dao = require('./../../dao/dao.js'),
    token = require('./../../helpers/token.js')
    bcrypt = require('bcrypt'),
    environment = process.env.NODE_ENV && process.env.NODE_ENV!== undefined? process.env.NODE_ENV :  'local',
    config = require('./../../config/config.js'),
    async = require('async'),
    emailer = require('./../../helpers/email.js'),
    shortid = require('shortid'),
    _ = require('lodash'),
    user_service = require('./../../services/user-service.js');
var device_types = ['android', 'ios'];


function formatUserForgotPasswordEmailTemplate(details){

    return {
        to : details.user && details.user.uEmail || [],
        subject : 'FORGOT PASSWORD',
        html : `<h3>FORGOT PASSWORD</h3><p></p><p>Dear ` + (details.user && details.user.uFirstName)  + " " + (details.user && details.user.uLastName) + `, </p><p></p><p>
                 You've recently requested to reset your password for NOTIFY ME.
                 Click the button below to reset it:
                 </p><p></p><br><a href="`
                 +  config[environment].host
                 + `/reset_password/ ` + details.key + '"' + `target="_blank"
                 style="text-decoration: none; color: #fff; background-color: #78c377; padding: 15px 25px; text-decoration: underline;">
                 Reset your password
                 </a><br><br><p>If you did not request a password reset, please ignore this email.</p>
                `
    }

}


/**
    * Api Interface for fetching User Credentials and authenticating the user
*/
router.post('/login', function(req, res) {

    var required_keys = ['email', 'password', 'device_type', 'device_token'];
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("email") || err.missing_keys.includes("password")){
               return util.formatErrorResponse(message.code.custom_bad_request, message.error.login.email_password_missing, function(err){
                    res.send(err);
               })
            }
            else if(err.missing_keys.includes("device_type")){
                return util.formatErrorResponse(message.code.custom_bad_request, message.error.login.device_type_missing, function(err){
                    res.send(err);
                })
            }
            else if(err.missing_keys.includes("device_token")){
                            return util.formatErrorResponse(message.code.custom_bad_request, message.error.login.device_token_missing, function(err){
                                                res.send(err);
                                           })
                        }
            else return util.formatErrorResponse(message.code.custom_bad_request, message.error.bad_request, function(err){
                res.send(err)
            })
        }

        if(!_.includes(device_types, req.body.device_type)) return util.formatErrorResponse(message.code.custom_bad_request, message.error.login.device_type_missing, function(err){
             res.send(err);
        })
        dao.getOneIndexIterator('Users', 'uEmail', req.body.email, null, null, function(err, result){

            if(err){
                console.error(message.error.default_error_prefix, err);
                return util.formatErrorResponse(err.code || message.code.internal_server_error, err.message || message.error.internal_server_error, function(err){
                  res.send(err);
                })
            }
            if(!result || result === undefined || Object.keys(result).length <1) return util.formatErrorResponse(0, message.error.login.invalid_credentials, function(err){
                res.send(err);
            })
            bcrypt.compare(req.body.password, result.uPassword, function(err, validation_status){
                if(!validation_status) return util.formatErrorResponse(message.code.custom_bad_request, message.error.login.invalid_credentials, function(err){
                    res.send(err);
                })
                async.parallel({
                    sign_token : function(callback){

                        token.signAndGenerateToken({
                            user_id : result.uID
                        }, function(err, token){

                            if(err) return callback(err);
                            callback(null, {
                                user_info: {
                                    last_name: result.uLastName,
                                    first_name: result.uFirstName,
                                    user_id: result.uID,
                                    avatar: config[environment].host + '/files/avatars/' + result.uID + '.jpg',
                                },
                                token: token
                            });

                        })

                    },
                    fetch_unread_notifications : function(callback){

                        user_service.fetchUserUnreadNotificationCount(result.uID, callback);

                    }
                }, function(err, result){

                     if(err) {
                        console.error(message.error.default_error_prefix, err);
                        return callback({
                            code : err.code || message.code.custom_bad_request,
                            message : err.message || message.error.internal_server_error
                        })
                     }
                     util.formatSuccessResponse(Object.assign({
                        msg: message.success.login.success,
                    }, result.fetch_unread_notifications, result.sign_token), function(result){
                        res.send(result);
                    })


                });

            })

        })

    });

});

/**
    * API Interface to logout a user from the system
    *@todo : Delete the device token once the User has logged out from the device
*/
router.post('/logout', function(req, res){

      if(!req.body.device_token){
        return util.formatErrorResponse('Provide Device Token for Logout', function(err){
            res.send(err);
        })
      }
      util.formatSuccessResponse({
        logout: 'success'
      }, function(result){
        res.json(result);
     })

});

/**
* API Interface to Refresh a Token that has neared its expiry time
* @Deprecated
*/
router.get('/refresh_token', function(req, res){

    token.signAndGenerateToken({
        user_id : req.user.user_id
    }, function(err, token){

        util.formatSuccessResponse({
            msg: message.success.login.token_refresh,
            token: token
        }, function(result){
            res.json(result);
        })

    })

});

/**
* API Interface to Send a email to the User To reset his password
*/
router.put('/forgot_password', function(req, res){

    async.auto({
        generate_password_reset_link : function(callback){

            var password_reset_key = shortid.generate();
            dao.updateDataIndexIterator(dao.TABLE_RECORD.USER, ['uID'], 'uEmail', req.body.email, {}, [
                {
                    table_name : dao.TABLE_RECORD.USER_ATTRIBUTE,
                    condition : {
                        'uaKey' : {
                            '$equals' : 'resetPasswordKey'
                        }
                    },
                    create_if_absent : true,
                    data : {
                        'uaKey' : 'resetPasswordKey',
                        'uaValue' : password_reset_key
                    }
                }
            ], function(err, result){

                if(err) return callback(err);

                callback(err, {
                    key  : password_reset_key,
                    user : result
                })

            })

        },
        send_password_reset_email : ['generate_password_reset_link', function(results, callback){
            emailer.sendEmail(formatUserForgotPasswordEmailTemplate(results.generate_password_reset_link), callback);
        }]
    },
    function(err, result){

        if(err) {
            console.error(message.error.default_error_prefix, err);
            return util.formatErrorResponse(err.code || message.code.custom_bad_request, err.message || message.error.internal_server_error, function(err){
                res.send(err);
            })
        }
        util.formatSuccessResponse({
            msg: 'Password Reset Email Sent'
        }, function(result){
            res.json(result);
        })

    });

});

module.exports = router;