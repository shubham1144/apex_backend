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
    shortid = require('shortid'),
    util = require('./../helpers/util.js'),
    message = require('./../helpers/message.json'),
    emailer = require('./../helpers/email.js'),
    constants = require('./../helpers/constant.js');


/**
* Function to format the User Validation Email being sent out to the User Created
*/
function formatUserValidateEmailTemplate(details){

    return {
        to : 'shubham@tentwenty.me',//details.user && details.user.uEmail || [],
        subject : 'NOTIFY ME - Account Activation',
        html : `<p>Dear ` + details.user.uName + `,</p><p>Please click the following URL in order to activate your account for Notify ME:</p><p>`+
                '<a href="http://notify.me.1020dev.com/activate_account/' + details.link +
                '">http://notify.me.1020dev.com/activate_account/' + details.link +
                `</a></p><p>Thank you!</p><p>
                Regards,<br>
                Notify ME
                </p>
               `
    }

}


/**
* Function to Fetch Details associated with the Users in System
*/
function fetchUserDetails(user_id, res_locals, callback){

    dao.getOneTableIterator('Users', {
            'uID' : user_id
            }, [{
            table_name : 'Users.UserAttributes',
            values : ['uaKey', 'uaValue']
    }], {
        values : [['uID', 'user_id'], ['uLastName', 'last_name'], ['uFirstName', 'first_name'], ['uEmail', 'email']]
    }, function(err, result){

        if(err) return callback("Database Error")

        Object.assign(result, {
            avatar: 'http://notify-me.1020dev.com/files/avatars/2.jpg?' + moment().unix(),
            contact : {
                phone_number : _.filter(result['Users.UserAttributes'] && result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0] ?
                               (_.filter(result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0]['uaValue']).split(" ")[1] || "" : null,
                country_code :  _.filter(result['Users.UserAttributes'] && result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0] ?
                                                              (_.filter(result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0]['uaValue']).split(" ")[0] || null : null
            },
            is_notification: "0",
            total_unread_notification_count: 0,
        });
        delete result['Users.UserAttributes'];

        util.formatSuccessResponseStandard(res_locals, { user : result }, function(result){
             callback(result);
        })

    });

}


/**
* API Interface to fetch Details associated with a User Profile
*/
router.get('/user', function(req, res){

    fetchUserDetails(req.user.user_id, res.locals, function(result){
        res.send(result)
    })

});

/**
* API Interface to update the details associated with a User Profile
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
         }else if(!util.jsonParseSync(req.body.contact)){
            return util.formatErrorResponse(0, message.error.json_parse_failure, function(err){
                return res.send(err);
            })
         }

         var user_details = {
                     uID : req.user.user_id,
                     uFirstName : req.body.first_name,
                     uLastName : req.body.last_name
                 }, contact = util.jsonParseSync(req.body.contact);
        async.auto({

        change_password : function(callback){

            if(!req.body.current_password || req.body.current_password === undefined) return callback(null);

            dao.getData('Users', {
                uID : req.user.user_id
            }, function(err, result){

                if(err) return callback(err);
                var uPassword = req.body.password, uPasswordConfirm = req.body.password_confirm;

                bcrypt.compare(req.body.current_password, result.uPassword, function(err, validation_status){
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
                    bcrypt.hash(uPassword, constants.BCRYPT.SALT_ROUNDS, function(err, hash) {
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
                    uaValue: contact.country_code + " " + contact.phone_number
                }
            }], function(err){

                if(err) return callback(err);
                callback(null);

            })

        }]
        }, function(err, result){

            if(err) {
                console.error("Error occured due to : ", err);
                return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error', function(err){
                    res.send(err);
                })
            }
            fetchUserDetails(req.user.user_id, res.locals, function(data){
                res.send(data);
            })

        })

    });

});

/*
* API To Register a User in the System Based on Unique Email Address
*/
router.post('/user', function(req, res){

 var required_keys = ['uname', 'email', 'first_name', 'last_name', 'contact', 'user_type'];//'profile_avatar_img' - key to be added once the image display is functional
    payload_validator.ValidatePayloadKeys(req.body, required_keys, function(err){

        if(err){
            if(err.missing_keys.includes("uname")){
                 return util.formatErrorResponse(0, 'Please enter a valid User Name', function(err){
                    res.send(err);
                })
            }
            else if(err.missing_keys.includes("first_name")){
                return util.formatErrorResponse(0, 'Please enter a valid First Name', function(err){
                    res.send(err);
                })
            }
            else if(err.missing_keys.includes("last_name")){
                return util.formatErrorResponse(0, 'Please enter a valid Last Name', function(err){
                    res.send(err);
                })
            }
            else{
                return util.formatErrorResponse(0, 'Bad Request', function(err){
                    res.send(err);
                })
            }
        }
        async.auto({
            create_user : function(callback){

                var user_password = shortid.generate(),
                    user_activate_key = shortid.generate(),
                    contact = req.body.contact;

                bcrypt.hash(user_password, constants.BCRYPT.SALT_ROUNDS, function(err, hash) {

                       var user = {
                          uID : shortid.generate(),
                          uName : req.body.uname,
                          uEmail : req.body.email,
                          uPassword : hash,
                          uFirstName : req.body.first_name,
                          uLastName : req.body.last_name,
                          uIsActive : true,
                          uIsValidated : false,
                          uType : req.body.user_type || 'Admin'//User type can be 'Admin | User | SuperUser(Across all subscriptions)'
                       }
                      dao.findOrCreateIndexIterator('Users', 'uEmail', req.body.email, ['uID'], user, [
                          {
                              table_name : 'Users.UserAttributes',
                              data : [{
                                  uaKey: 'contactNumber',
                                  uaValue: contact.country_code + " " + contact.phone_number
                              }, {
                                    uaKey: 'activationKey',
                                    uaValue: user_activate_key
                              }]
                          }
                      ], function(err, created){

                            callback(err, {
                                user : user,
                                link : user_activate_key,
                                created : created
                            });

                      })

                });

            },
            send_user_created_email : ['create_user', function(results, callback){
                if(!results.create_user.created) return callback({
                    code : 0,
                    message : "User Email Already Registered"
                })
                emailer.sendEmail(formatUserValidateEmailTemplate(results.create_user), callback);
            }]
        }, function(err){
           console.log("User Creation Status : ", err);
           if(err) {
               console.error("Error occured due to : ", err);
               return util.formatErrorResponse(err.code || 0, err.message || 'Internal Server Error', function(err){
                   res.send(err);
               })
           }
           util.formatSuccessResponseStandard(res.locals, { msg : "User Account Generated" }, function(result){
                res.send(result);
           })

        });

    });

});

/**
* API Interface to Activate a User Account that has been registered in the system
*/
router.get('/activate_account', function(req, res){
    //@todo: Need to Work on API to activate user account
    res.send("User Account Activated, Please visit site to login");
});


module.exports = router;