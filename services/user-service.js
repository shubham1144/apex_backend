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
                '<a href="' + config.host + '/activate_account/' + details.link +
                '">' + config.host + '/activate_account/' + details.link +
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

        if(err) return callback("Database Error")
        //console.log("The User Details Fetched are : ", result)
        if(!result || Object.keys(result).length < 1) return callback({
            code : 401,
            message : "User Not Found"
        })
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
        callback(null, {
            user : result
        })

    });

};

/**
    * Function to Register a user in the system
*/
exports.addUser = function(data, callback){

};

/**
    *Function to Edit Details associated with a User associated with the Platform
*/
exports.editUser = function(data, callback){

};
