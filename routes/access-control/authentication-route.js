var moment = require('moment'),
    token_helper = require('./../../helpers/token.js'),
    constants = require('./../../helpers/constant.js'),
    message = require('./../../helpers/message.json');


/**
    * Function to be used to refresh a token that has neared expiry.
*/
module.exports = function(req, res, next){

    if(!req.headers['authorization']) return next();
    token_helper.verifyToken(req.headers['authorization'].split(" ")[1], function(err, decoded_token){

        if(err) {
            console.error(message.error.default_error_prefix, err);
            return next({
                code : message.code.unauthorized,
                message : message.error.token_expired_invalid
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
