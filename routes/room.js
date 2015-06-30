var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    var user;
    if (req.session.passport.user.provider === 'spotify') {
        user = {
            name: req.user.displayName != undefined ? req.user.displayName.split(' ', 1)[0] : req.user.username.split('.', 1)[0],
            pic: req.user.photos[0] != undefined ? req.user.photos[0] : '/images/default-avatar.jpg'
        }
    } else if (req.session.passport.user.provider === 'facebook') {
        user = {name: req.user.name.givenName, pic: req.user.photos[0].value}
    }
    res.render('page', {user: user});
});

module.exports = router;
