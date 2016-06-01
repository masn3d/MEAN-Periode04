/**
 * Created by martins on 5/27/16.
 */
var express = require('express');
var router = express.Router();
var User = require('../models/Users'); // get the mongoose model
var jwtConfig = require("../config/jwtConfig").jwtConfig; // get the configuration for our token.
var jwt = require('jwt-simple'); // get the npm we used to create the Token.
var passport = require("passport"); //passport is used to handle strategy of Token.


router.get('/', function (req, res, next) {
    passport.authenticate('jwt', {session: false}, function (err, user, info) {
        console.log(user.username);
        if (err) {
            res.status(403).json({mesage: "Token could not be authenticated", fullError: err});
        }
        if (user) {
            //redirect/render user to page based on their role.
            if (user.role == 'admin') {
                res.render('adminPage', {userObj: user});
            } else if (user.role == 'user') {
                res.render('userPage', {userObj: user});
            } else {
                // bad user role - just render login page.
                //res.status(403).json({mesage: "Role not valid", fullError: err});
                req.msg = "Account has no valid role";
                req.url = "/login";
                return next();
            }
        }
        //res.status(403).json({mesage: "Token could not be authenticated", fullError: info});
        //req.msg = "Test af msg";
        res.redirect('/login');
        //return next();
    })(req, res, next);
});

router.get('/login', function (req, res, next) {
    if (req.msg) {
        var errorMsg = req.msg;
        req.msg = undefined;
        console.log('til loginpage');
        res.render('login', {errorMsg: errorMsg});
    }
    res.render('login', {errorMsg: ""});
});

router.get('/signup', function (req, res, next) {
    res.render('signup');
});

// create a new user account (POST http://localhost:8080/api/signup)
router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password || !req.body.role) {
        res.json({success: false, msg: 'Please pass username and password and role.'});
    } else {
        console.log("req.body.name:" + req.body.username + ", req.body.password: " + req.body.password);
        var newUser = new User({
            username: req.body.username,
            password: req.body.password,
            role: req.body.role
        });
        // save the user
        newUser.save(function (err) {
            if (err) {
                return res.json({success: false, msg: 'Username already exists.'});
            }
            res.json({success: true, msg: 'Successful created new user.'});
        });
    }
});

//Authentication
//Create Token if user and password checks out.
router.post('/authentication', function (req, res) {
   // console.log('kommer ind i login POST');

    User.findOne({
        username: req.body.username
    }, function (err, user) {
        console.log(user);
        if (err) throw err;
        if (!user) {
            res.status(401).send({msg: 'Authentication failed. User not found.'});
        } else {
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
// if user is found and password is right create a token
                    var iat = new Date().getTime() / 1000; //convert to seconds
                    var exp = iat + jwtConfig.tokenExpirationTime;
                    var payload = {
                        aud: jwtConfig.audience,
                        iss: jwtConfig.issuer,
                        iat: iat,
                        exp: exp,
                        sub: user.username
                    }
                    console.log(jwtConfig.secret);
                    var token = jwt.encode(payload, jwtConfig.secret);

                    //authorization:
                    if (user.role == 'admin') {
                        res.render('adminPage', {title: "Admin Page", userObj: user, token: 'JWT ' + token});
                    } else if (user.role == 'user') {
                        res.render('userPage', {title: "User Page", userObj: user, token: 'JWT ' + token});
                    }
                } else {
                    res.render('login', {errormMsg: 'Authentication failed. Wrong password.'});
// return the information including token as JSON
                    //res.json({token: 'JWT ' + token});
                }
            });
        }
    });
});

module.exports = router;
