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
    moment = require('moment'),
    async = require('async'),
    bcrypt = require('bcrypt'),
    constants = require('./../helpers/constant.js');


function fetchUserDetails(user_id, mode, callback){

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

        util.formatSuccessResponse(mode === 'view'? result : { user : result }, function(result){
             callback(result);
        })

    });

}
/**
* API Interface to fetch Details associated with a User Profile
* @todo Make Modification in the Response Format being sent out
*/
router.get('/user', function(req, res){

    fetchUserDetails(parseInt(req.user.user_id), 'view', function(result){
        res.send(result)
    })

});

/**
* API Interface to update the details associated with a User Profile
*/
router.post('/user/edit', function(req, res){

    console.log("The Payload received is : ", req.body);
    var required_keys = ['first_name', 'contact', 'is_notification', 'last_name'];//'profile_avatar_img' - key to be added once the image display is functional
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){
         if(err){
                    if(err.missing_keys.includes("first_name")){
                       return util.formatErrorResponse(0, 'Please enter a valid First Name', function(err){
                            res.send(err);
                       })
                    }
         }

        var user_details = {
            uID : parseInt(req.user.user_id),
            uFirstName : req.body.first_name,
            uLastName : req.body.last_name
        }
        async.auto({

        change_password : function(callback){

            if(!req.body.uCurrentPassword || req.body.uCurrentPassword === undefined) return callback(null);

            dao.getData('Users', {
            uID : parseInt(req.user.user_id)
            }, function(err, result){

                if(err) return callback(err);
                var uPassword = req.body.uPassword, uPasswordConfirm = req.body.uPasswordConfirm;

                bcrypt.compare(req.body.uCurrentPassword, result.uPassword, function(err, validation_status){
                    if(!validation_status) return callback({
                        code : 0,
                        message : 'The current password is incorrect'
                    })
                    if(uPassword.length < 5 || uPassword.length > 128) return callback({
                        code : 0,
                        message : 'Password must be between 5 to 128 characters'
                    })
                    if(!uPasswordConfirm || uPasswordConfirm !== uPassword) return callback({
                        code : 0,
                        message : 'The two passwords provided do not match'
                    })
                    bcrypt.hash(req.body.uPassword, constants.BCRYPT.SALT_ROUNDS, function(err, hash) {
                        callback(null, {
                            new_password : hash
                        });
                    })
                });

            })

        },
        update_user : ['change_password', function(results, callback){

            if(results.change_password && results.change_password.new_password){
                user_details = Object.assign(user_details, {
                    uPassword : results.change_password.new_password
                })
            }
            dao.updateDataWithChild('Users', ['uID'], user_details, [{
            table_name : 'Users.UserAttributes',
            data : {
                uaKey: "contactNumber",
                uaValue: req.body.contact
            }
            }], function(err){

                if(err) return callback({
                    code : 0,
                    message : 'Please enter a valid First Name'
                });
                callback(null);

            })

        }]
        }, function(err, result){

            if(err) return util.formatErrorResponse(err.code || 0, err.message || 'Bad Request', function(err){
                res.send(err);
            })
            fetchUserDetails(parseInt(req.user.user_id), 'update', function(data){
                res.send(data);
            })

        })

    });

});

module.exports = router;