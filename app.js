var createError = require('http-errors'),
    express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    jwt = require('express-jwt'),
    util = require('./helpers/util.js'),
    message = require('./helpers/message.json'),
    constant = require('./helpers/constant.js');
var cors = require('cors');


var swaggerUi = require('swagger-ui-express');
const swaggerDocumentV1 = require('./documentation/v1_swagger.json');
var options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customJs: '/javascripts/custom.js'
};

/* Configuration of All the Routes associated with the Platform START*/
var indexRouter = require('./routes/index'),
    authorizationRouter = require('./routes/access-control/authorization-route'),
    authenticationRouter = require('./routes/access-control/authentication-route'),
    userRouter = require('./routes/user-route');
/* Configuration of All the Routes associated with the Platform END*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'files')));
//Configuration for Exposing Swagger Documentation for Api's based on versioning system
app.use('/v1/apidocs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentV1, options));

//Configuration for JWT Stateless Oauth Authentication
app.use(jwt({ secret: constant.JWT.SECRET})
.unless({path: ['/', /\/files*/, /\/activate_account*/, { url : '/test_token', methods : ['GET']},
                     { url : '/user', methods : ['POST']},
                     { url : '/forgot_password', methods : ['PUT']},
                     { url : '/reset_password', methods : ['PUT']},
                     { url : '/login', methods : ['POST']},
                     { url : '/login/logout', methods : ['POST']}]
}));

app.all('*', indexRouter, authorizationRouter, authenticationRouter, userRouter);

/* Error Handles Configuration START*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  if (err.name === 'UnauthorizedError') {
    return util.formatErrorResponse(401, { msg : message.error.token_expired_invalid }, function(err){
      res.status(401).send(err);
    })
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/* Error Handles Configuration END*/

//Node.js Server Listening on a PORT
app.listen(3000, function(port){
    console.log("APEX NODE.JS Local Server Running on port : 3000");
});

module.exports = app;
