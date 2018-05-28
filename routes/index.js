var express = require('express'),
    router = express.Router(),
    dao = require('./../dao/dao.js'),
    bcrypt = require('bcrypt'),
    constants = require('./../helpers/constant.js'),
    shortid = require('shortid');

/**
* GET home page.
*/
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*API Interface to check connection associated with database*/
//The Business logic below can be used for The Purpose of User Registration at later phases in the Development
router.get('/check_database_crud_connection', function(req, res){

    bcrypt.hash('testPassword', constants.BCRYPT.SALT_ROUNDS, function(err, hash) {
      // Store hash in your password DB.
          dao.createDataWithChild('Users', ['uID'], {
              uID : shortid.generate(),
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
                    udToken: 'Test'
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
              dao.getOneTableIterator('Users', {
                  uEmail : 'shubham@tentwenty.me'
              }, ['Users.UserDevices', 'Users.UserAttributes'], null, function(err, result){
                   if(err) return res.send("Database Error")
                   res.send("Notify.me Backend Server Health Status : Good");
              })

          })
    });

});

router.get('/test_token', function(req, res){

     token.signAndGenerateTokenTest({
                        user_id : req.query.user_id
                    }, req.query.expiry || 300, function(err, token){

                        util.formatSuccessResponse({
                            msg: "Test Token Being Generated for Development Ease",
                            token: token
                        }, function(result){
                            res.json(result);
                        })

     })

})

module.exports = router;
