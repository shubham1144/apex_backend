var subscription_service = require('./../services/subscription-service.js'),
    util = require('./../helpers/util.js');


/*API Interface to Add a subscription in the system*/
exports.addSubscription = function(req, res){

   subscription_service.addSubscription(req.user.user_id, req.body, function(err, result){

        if(err) {
            return util.formatErrorResponse(err.code, err.message, function(err){
                res.send(err);
            })
        }
        util.formatSuccessResponseStandard(res.locals, result, function(formatted_result){
             res.send(formatted_result);
        })

    })

};