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
* Function to Invalidate a JWT Token
*/
exports.invalidateToken = function(token, callback){
    
};