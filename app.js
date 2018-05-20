var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('express-jwt');

var indexRouter = require('./routes/index');
var authorizationRouter = require('./routes/access-control/authorization-route.js');
var domainRouter = require('./routes/domain');
var userRouter = require('./routes/user');
var notificationRouter = require('./routes/notification');

var constant = require('./helpers/constant.js');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(jwt({ secret: constant.JWT.SECRET}).unless({path: ['/', { url : '/login', methods : ['POST']}]}));

app.all('*', indexRouter, authorizationRouter, domainRouter, userRouter, notificationRouter);

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

//Node.js Server Listening on a PORT
app.listen(3000, function(port){
    console.log("NOTIFY.ME NODE.JS Local Server Running on port : 3000");
});

module.exports = app;
