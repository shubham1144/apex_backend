/**
* Subscription will be against Plans provided by The Platform to Clients
* Users(Admin) will Be Subscribing to plan and then there will be Domains associated with the Subscription
* Subscription will be Associated with a User...
* @module Subscriptions
*/
var dao = require('./../dao/dao.js'),
    shortid = require('shortid');

/**
*   Function to add a Subscription in the System
*/
exports.addSubscription = function(user_id, data, callback){

 dao.createDataWithChild('Plans.Subscriptions', null, {
      pID : 'B19VQme1X',//Using a Default Plan For all the Subscriptions Temporaily
      sID : shortid.generate(),
      uID : user_id,//For now The Logged in User Will be assocaited with the Subscription
      sIsActive : true,
      sParentID : null,
      users : [user_id]
  }, null, function(err){
      if(err){
          console.error("Error occured due to : ", err);
          return callback({
            code : 500,
            message : "Internal Server Error"
          })
      }
      callback(null, { msg : "Mock Subscription Account has been activated" });
  })

};