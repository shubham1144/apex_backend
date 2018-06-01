var domain_service = require('./../services/domain-service.js'),
    util = require('./../helpers/util.js');

/*API Interface to be used to fetch details associated with domains*/
exports.fetchDomains = function(req, res) {

   domain_service.fetchDomains(req.user.user_id, req.query.page, req.query.domain_id, function(err, result){

        if(err) {
            return util.formatErrorResponse(err.code, err.message, function(err){
                res.send(err);
            })
        }
        util.formatSuccessResponseStandard(res.locals, result, function(formatted_result){
             res.send(formatted_result);
        })

    });

};

/*API Interface to be used to add a domain in the system*/
exports.addDomain = function(req, res){

    domain_service.addDomain(req.user.user_id, function(err, result){

         if(err) {
             return util.formatErrorResponse(err.code, err.message, function(err){
                 res.send(err);
             })
         }
         util.formatSuccessResponseStandard(res.locals, result, function(formatted_result){
              res.send(formatted_result);
         })

    });

};