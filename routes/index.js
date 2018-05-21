var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js');
var bcrypt = require('bcrypt');
var constants = require('./../helpers/constant.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*API Interface to check connection associated with database*/
//The Business logic below can be used for The Purpose of User Registration at later phases in the Development
router.get('/check_database_crud_connection', function(req, res){

    bcrypt.hash('testPassword', constants.BCRYPT.SALT_ROUNDS, function(err, hash) {
      // Store hash in your password DB.
          dao.updateDataWithChild('Users', ['uID'], {
              uID : 1,//Over time use a sequence generator to associate for key
              uName : 'Shubham Chodankar',
              uEmail : 'shubham@tentwenty.me',
              uPassword : hash,
              uFirstName : 'Shubham',
              uLastName : 'Chodankar',
              uIsActive : true,
              uIsValidated : true,
              uType : 'Admin'
          }, [
              {
                  table_name : 'Users.UserDevices',
                  data : {
                  }
              },
              {
                  table_name : 'Users.UserAttributes',
                  data : {
                      uaKey: 'contactNumber',
                      uaValue: '8975567457'
                  }
              }
          ], function(err){

              if(err) return res.send("Database Error")
              dao.getDataWithChildByIteration('Users', {
                  uEmail : 'shubham@tentwenty.me'
              }, ['Users.UserDevices', 'Users.UserAttributes'], function(err, result){
                   if(err) return res.send("Database Error")
                   res.send("Notify.me Backend Server Health Status : Good");
              })

          })
    });



});

module.exports = router;
