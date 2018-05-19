var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*API Interface to check connection associated with database*/
router.get('/check_database_crud_connection', function(req, res){

    dao.putDataWithChild('Users', ['uEmail', 'uPassword'], {
        uID : 1,//Over time use a sequence generator to associate for key
        uName : 'Shubham Chodankar Updated',
        uEmail : 'shubham@tentwenty.me',
        uPassword : 'testPassword',
        uFirstName : 'Shubham',
        uLastName : 'Chodankar',
        uIsActive : true,
        uIsValidated : true,
        uType : 'Admin'
    }, [
        {
            table_name : 'Users.UserDevices',
            data : {
                udID : 1
            }
        },
        {
            table_name : 'Users.UserAttributes',
            data : {
                uaID : 1,
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

module.exports = router;
