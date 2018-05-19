/**
*
* @Author Shubham Chodankar
*/
var _ = require('lodash');
/**
* Function to Validate Payload Request in the client API Request Interpreted
*/
exports.strictValidatePayloadKeys = function(payload, expected_keys, callback){
    callback(null);
};

/* Allow if more keys are present along with the required keys*/
//Send the Missing keys in the response to the caller function
exports.ValidatePayloadKeys = function(payload, expected_keys, callback){

    //Omit null or undefined keys from payload keys
    var missing_keys = _.difference(expected_keys, Object.keys(_.pickBy(payload, _.identity)));
    if(missing_keys.length > 0) return callback({
        missing_keys : missing_keys
    });
    callback(null);

};