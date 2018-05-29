/**
* @Author Shubham Chodankar
* @module Token
* @description This module is associated with all the logic associated with jwt tokens
*/
var jwt = require('jsonwebtoken')
    constants = require('./constant.js');
/**
    * Function to be Used to Sign and Generate a JWT Token
*/
exports.signAndGenerateToken = function(content_to_be_signed, callback){

    var token = jwt.sign(content_to_be_signed,  constants.JWT.SECRET, {
        issuer : constants.JWT.ISSUER,
        audience : constants.JWT.AUDIENCE,
        jwtid : constants.JWT.JWTID,
        expiresIn : constants.JWT.EXPIRES_IN
    }, callback)

};

/**
    *Function to Be Used to Verify an existing JWT Token
*/
exports.verifyToken = function(token, callback){

    jwt.verify(token, constants.JWT.SECRET, callback);

};

exports.signAndGenerateTokenTest = function(content_to_be_signed, expiry, callback){

    var token = jwt.sign(content_to_be_signed,  constants.JWT.SECRET, {
        issuer : constants.JWT.ISSUER,
        audience : constants.JWT.AUDIENCE,
        jwtid : constants.JWT.JWTID,
        expiresIn : expiry
    }, callback)

};

