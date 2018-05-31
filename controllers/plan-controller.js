var dao = require('./../dao/dao.js'),
    shortid = require('shortid'),
    message = require("./../helpers/message.json"),
    plan_service = require('./../services/plan-service.js');


/* API Interface to register a plan in the System*/
exports.addPlan = function(req, res){

  plan_service.addPlan(req.body, function(err, result){

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