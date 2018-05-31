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
                '<a href="' + config[environment].host + '/activate_account/' + details.link +
                '">' + config[environment].host + '/activate_account/' + details.link +
                `</a></p><p>Thank you!</p><p>
                Regards,<br>
                Notify ME
                </p>
               `
    }

}


/**
    * Function to fetch Details associated with a User associated with the Platform
*/
exports.fetchUser = function(user_id, callback){

    dao.getOneTableIterator('Users', {
            'uID' : user_id
            }, [{
            table_name : 'Users.UserAttributes',
            values : ['uaKey', 'uaValue']
    }], {
        values : [['uID', 'user_id'], ['uLastName', 'last_name'], ['uFirstName', 'first_name'], ['uEmail', 'email']]
    }, function(err, result){

        if(err) return callback({
            code : err.code || 0,
            message : err.message || "Internal Server Error"
        })

        if(!result || Object.keys(result).length < 1) return callback({
            code : 401,
            message : "User Not Found"
        })
        Object.assign(result, {
            avatar: config[environment].host + '/files/avatars/' + result.uID + '.jpg?' + moment().unix(),
            contact : {
                phone_number : _.filter(result['Users.UserAttributes'] && result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0] ?
                               (_.filter(result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0]['uaValue']).split(" ")[1] || "" : null,
                country_code :  _.filter(result['Users.UserAttributes'] && result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0] ?
                                                              (_.filter(result['Users.UserAttributes'], {  "uaKey": "contactNumber" })[0]['uaValue']).split(" ")[0] || null : null
            },
            is_notification: "0",
            total_unread_notification_count: 0
        });

        delete result['Users.UserAttributes'];
        callback(null, {
            user : result
        })

    });

};

/**
    *Function to Edit Details associated with a User associated with the Platform
*/
exports.editUser = function(user_id, data, callback){

    var required_keys = ['first_name', 'contact', 'is_notification', 'last_name'];//'profile_avatar_img' - key to be added once the image display is functional
    payload_validator.ValidatePayloadKeys(data, required_keys, function(err){
                 if(err){
                            if(err.missing_keys.includes("first_name")){
                                return callback({
                                    code : 0,
                                    message : "Please enter a valid First Name"
                                })
                            }
                 }else if(!util.jsonParseSync(data.contact)){

                    return callback({
                        code : 0,
                        message : message.error.json_parse_failure
                    })

                 }

                 var user_details = {
                             uID : user_id,
                             uFirstName : data.first_name,
                             uLastName : data.last_name
                 }, contact = util.jsonParseSync(data.contact);
                async.auto({

                change_password : function(callback){

                    if(!data.current_password || data.current_password === undefined) return callback(null);

                    dao.getData('Users', {
                        uID : user_id
                    }, function(err, result){

                        if(err) return callback(err);
                        var uPassword = data.password, uPasswordConfirm = data.password_confirm;

                        bcrypt.compare(data.current_password, result.uPassword, function(err, validation_status){
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
                        return callback({
                            code : err.code || 0,
                            message : err.message || "Internal Server Error"
                        })
                    }
                    exports.fetchUser(user_id, callback);
                })

    });

};


/**
    * Function to Register a user in the system
*/
exports.addUser = function(data, callback){

   var required_keys = ['uname', 'email', 'first_name', 'last_name', 'contact', 'user_type'];//'profile_avatar_img' - key to be added once the image display is functional
      payload_validator.ValidatePayloadKeys(data, required_keys, function(err){

          if(err){
              if(err.missing_keys.includes("uname")){
                    return callback({
                        code : 0,
                        message : 'Please enter a valid User Name'
                    })
              }
              else if(err.missing_keys.includes("first_name")){
                    return callback({
                        code : 0,
                        message : 'Please enter a valid First Name'
                    })
              }
              else if(err.missing_keys.includes("last_name")){

                    return callback({
                        code : 0,
                        message : 'Please enter a valid Last Name'
                    })
              }
              else{
                return callback({
                    code : 0,
                    message : 'Bad Request'
                })
              }
          }
          async.auto({
              create_user : function(callback){

                  var user_password = shortid.generate(),
                      user_activate_key = shortid.generate(),
                      contact = data.contact;

                  bcrypt.hash(user_password, constants.BCRYPT.SALT_ROUNDS, function(err, hash) {

                         var user = {
                            uID : shortid.generate(),
                            uName : data.uname,
                            uEmail : data.email,
                            uPassword : hash,
                            uFirstName : data.first_name,
                            uLastName : data.last_name,
                            uIsActive : true,
                            uIsValidated : false,
                            uType : data.user_type || 'Admin'//User type can be 'Admin | User | SuperUser(Across all subscriptions)'
                         }
                        dao.findOrCreateIndexIterator('Users', 'uEmail', data.email, ['uID'], user, [
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

                if(err) {
                    console.error("Error occured due to : ", err);
                    return callback({
                        code : err.code || 0,
                        message : err.message || "Internal Server Error"
                    })
                }
                callback(null, {
                    msg : "User Account Generated"
                })

          });

      });

};