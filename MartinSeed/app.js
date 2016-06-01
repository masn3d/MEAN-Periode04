var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var passport = require('passport');
var logger = require('morgan');
var mongoose = require('mongoose');
var config = require('./config/database'); // get db config file

//var port = process.env.PORT || 8080;

var users = require('./routes/users');
var APIrouter = require('./routes/api');
var indexRouter = require('./routes/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// for our request parameters (when using POST and PUT)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var passportConfig = require("./config/passport");
passportConfig(passport);

// for error logging.
app.use(logger('dev'));

app.use('/', indexRouter);
app.use('/users', users);

//Only allow access to api methods, if client has token.
app.use('/api', function (req, res, next) {
    passport.authenticate('jwt', {session: false}, function (err, user, info) {
        if (err) {
            res.status(403).json({mesage: "Token could not be authenticated", fullError: err})
        }
        if (user) {
            return next();
        }
        return res.status(403).json({mesage: "Token could not be authenticated", fullError: info});
    })(req, res, next);
});

app.use('/api', APIrouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
