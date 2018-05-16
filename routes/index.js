var express = require('express');
var router = express.Router();
var dao = require('./../dao/dao.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*API Interface to check connection associated with database*/
router.get('/check_database_connection', function(req, res){

       dao.getData('users', {
               id : 1
             }, function(err, result){
                if(!err) res.send("Connection to Primary Database is Currently Active");
             })

});

module.exports = router;
