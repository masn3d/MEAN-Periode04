var TheUser = require('../models/Users');

//Get user
function getUser(username, callback) {

    User.find({username: 'username'}, function (err, theUser) {
        if (err) {
            callback(err);
        }
        callback(null, theUser);
    });
}




