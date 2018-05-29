var moment = require('moment'),
    token_helper = require('./../../helpers/token.js'),
    constants = require('./../../helpers/constant.js');


/**
    * Function to be used to refresh a token that has neared expiry.
*/
module.exports = function(req, res, next){

    token_helper.verifyToken(req.headers['authorization'].split(" ")[1], function(err, decoded_token){

        if(err) {
            console.error("Error Occured due to : ", err)
            return next({
                code : 401,
                message : "Invalid OAuth Token Passed"
            });
        }
        var seconds_to_expiry = decoded_token.exp - moment().unix();
        if(seconds_to_expiry <= (constants.JWT.THRESHOLD_FACTOR * constants.JWT.EXPIRES_IN)){

            token_helper.signAndGenerateToken({ user_id : decoded_token.user_id }, function(err, refreshed_token){
                         res.locals.token = refreshed_token;
                         next();
            });

        }else next();

    })

};
