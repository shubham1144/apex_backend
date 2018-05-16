var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*API Interface to check connection associated with database*/
router.get('/check_database_crud_connection', function(req, res){

    dao.putDataWithChild('users', 'uID', {
        uID : 1,
        uName : 'Shubham Chodankar',
        uEmail : 'shubham@tentwenty.me',
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
                uaID : 1
            }
        }
    ], function(err){

        if(err) return res.send("Database Error")
        dao.getData('users', {
            uID : 1
        }, function(err, result){
            //if(!err) res.send("Connection to Primary Database is Currently Active");
             if(err) return res.send("Database Error")
             res.send(result);
        })

    })

});

module.exports = router;
