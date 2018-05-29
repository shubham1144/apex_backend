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
    constants = require('./../helpers/constant.js');

/**
* Function to Fetch Details associated with the Users in System
*/
function fetchUserDetails(user_id, callback){

    dao.getOneTableIterator('Users', {
            'uID' : user_id
            }, [{
            table_name : 'Users.UserAttributes',
            values : ['uaKey', 'uaValue']
    }], {
        values : [['uID', 'user_id'], ['uLastName', 'lastname'], ['uFirstName', 'firstname'], ['uEmail', 'email']]
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

        util.formatSuccessResponseStandard(res.locals, { user : result }, function(result){
             callback(result);
        })

    });

}


/**
* API Interface to fetch Details associated with a User Profile
*/
router.get('/user', function(req, res){

    fetchUserDetails(req.user.user_id, function(result){
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

            if(!req.body.uCurrentPassword || req.body.uCurrentPassword === undefined) return callback(null);

            dao.getData('Users', {
                uID : req.user.user_id
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
            fetchUserDetails(req.user.user_id, function(data){
                res.send(data);
            })

        })

    });

});

/*
* API To Register a User in the System
* @todo : Work on the api for Registering a User in the System
*/
router.post('/user', function(req, res){

        return res.send("Testing User Creation API");
        //Returning as below is being done by restricted priviledged users for now
        bcrypt.hash('testPassword', constants.BCRYPT.SALT_ROUNDS, function(err, hash) {

              dao.createDataWithChild('Users', ['uID'], {
                  uID : shortid.generate(),
                  uName : 'Idris',//Place the Uname of the User here
                  uEmail : 'idris@tentwenty.me',//Place the Email of the User here
                  uPassword : hash,
                  uFirstName : 'idris',//Place the First Name of the User here
                  uLastName : 'khozema',//Place the Last Name of the User here
                  uIsActive : true,
                  uIsValidated : true,
                  uType : 'Admin'//User type can be 'Admin | User | SuperUser(Across all subscriptions)'
              }, [
                  {
                      table_name : 'Users.UserDevices',
                      data : {
                        udToken: 'testToken'
                      }
                  },
                  {
                      table_name : 'Users.UserAttributes',
                      data : {
                          uaKey: 'contactNumber',
                          uaValue: '+91 8975567457'
                      }
                  }
              ], function(err){

                  if(err) return res.send("Database Error")
                  dao.getOneTableIterator('Users', {
                      uEmail : 'syed@tentwenty.me'
                  }, ['Users.UserDevices', 'Users.UserAttributes'], null, function(err, result){
                       if(err) return res.send("Database Error")
                       res.send("Notify.me Backend Server Health Status : Good");
                  })

              })
        });

});


module.exports = router;