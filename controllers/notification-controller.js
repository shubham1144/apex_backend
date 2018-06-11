var notification_service = require('./../services/notification-service.js'),
    util = require('./../helpers/util.js');


/*API Interface to fetch data associated with notification that are linked to domain accessible to the requesting user via the subscription*/
exports.fetchNotifications = function(req, res){

    notification_service.fetchNotifications(req.user.user_id, req.query.domain_id, req.query.form_id, req.query.page, req.query.keywords, req.query.archive, req.query.status,
    function(err, result){

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

/* API Interface to fetch Codes Associated with Notification Status and Call log Status*/
exports.fetchNotificationStatusCodes = function(req, res){

    notification_service.fetchNotificationStatusCodes(req.query.type, function(err, result){

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

/*API Interface to fetch Details associated with a notification */
exports.fetchNotification = function(req, res){

    notification_service.fetchNotification(req.params.notification_id, function(err, result){

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

/*API Interface to add a notification in the system*/
exports.addNotification = function(req, res){

  notification_service.addNotification(req.body.data, function(err, result){

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

/*API Interface to Add a call log against a notification*/
exports.addCallLog = function(req, res){

    notification_service.addCallLog(req.user.user_id, req.params.notification_id, req.body, function(err, result){

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

/*API Interface to Update a call log against a notification*/
exports.updateCallLog = function(req, res){

     notification_service.updateCallLog(req.params.notification_id, req.body, function(err, result){

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

/*API Interface to Add notes to be associated with a Notification*/
exports.addNotes = function(req, res){

     notification_service.addNotificationNote(req.user.user_id, req.params.notification_id, req.body, function(err, result){

            if(err) {
                return util.formatErrorResponse(err.code, err.message, function(err){
                    res.send(err);
                })
            }
            util.formatSuccessResponseStandard(res.locals, result, function(formatted_result){
                 res.send(formatted_result);
            })

        });

}