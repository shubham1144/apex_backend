var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('express-jwt');
var constant = require('./helpers/constant.js');

var swaggerUi = require('swagger-ui-express');
const swaggerDocumentV1 = require('./documentation/v1_swagger.json');
var options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customJs: '/javascripts/custom.js'
};

/* Configuration of All the Routes associated with the Platform START*/
var indexRouter = require('./routes/index'),
    authorizationRouter = require('./routes/access-control/authorization-route.js'),
    authenticationRouter = require('./routes/access-control/authentication-route.js'),
    planRouter = require('./routes/plan'),
    subscriptionRouter = require('./routes/subscription'),
    domainRouter = require('./routes/domain'),
    userRouter = require('./routes/user'),
    notificationRouter = require('./routes/notification');
/* Configuration of All the Routes associated with the Platform END*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Configuration for Exposing Swagger Documentation for Api's based on versioning system
app.use('/v1/apidocs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentV1, options));

//Configuration for JWT Stateless Oauth Authentication
app.use(jwt({ secret: constant.JWT.SECRET}).unless({path: ['/', '/check_database_crud_connection', { url : '/test_token', methods : ['GET']}, { url : '/forgot_password', methods : ['PUT']}, { url : '/login', methods : ['POST']}, { url : '/login/logout', methods : ['POST']}, { url : '/notifications', methods : ['POST']}]}));

app.all('*', indexRouter, authorizationRouter, authenticationRouter, domainRouter, userRouter, notificationRouter, planRouter, subscriptionRouter);

/* Error Handles Configuration START*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  if (err.name === 'UnauthorizedError') {
    return res.status(401).send('invalid token...');
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
    console.log("NOTIFY.ME NODE.JS Local Server Running on port : 3000");
});

module.exports = app;
