var express = require('express'),
    router = express.Router(),
    token = require('./../helpers/token.js'),
    util = require('./../helpers/util.js');

/**
* GET home page.
*/
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
* API To be used to generate a test token
*/
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

});


module.exports = router;
