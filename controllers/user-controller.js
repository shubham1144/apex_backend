var user_service = require('./../services/user-service.js'),
    util = require('./../helpers/util.js'),
    constant = require('./../helpers/constant.js'),
    file_upload = require('./../helpers/file_upload.js');


/*
    *API Interface to Function that will be used to fetch details associated with a user
*/
exports.fetchUser = function(req, res){

    user_service.fetchUser(req.user.user_id, function(err, result){

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

/*
    *API Interface to Edit details associated with a user
*/
exports.editUser = function(req, res){

    file_upload.uploadSingleFile(req, res, {
        destination : constant.USER.PROFILE_FOLDER,
        file_name : req.user.user_id + '.jpg',
        key : 'avatar'
    }, function(err){

        if(err) console.error("Error occured due to : ", err)
        user_service.editUser(req.user.user_id, req.body, function(err, result){

           if(err) {
               return util.formatErrorResponse(err.code, err.message, function(err){
                   res.send(err);
               })
           }
           util.formatSuccessResponseStandard(res.locals, result, function(formatted_result){
                res.send(formatted_result);
           })

        })

    })

};

/*
    *API Interface to Register a User in the System
*/

exports.addUser = function(req, res){

  user_service.addUser(req.body, function(err, result){

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

/*
    *API Interface to validate and activate a user that has been registered in the system
    *@todo: Need to Work on API to activate user account
*/
exports.validateUser = function(req, res){

    res.send("User Account Activated, Please visit site to login");

};