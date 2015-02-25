var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  console.log(req.session.passport.user);
    var user;
    if(req.session.passport.user.provider === 'spotify'){
       user =  {name: req.user.displayName.split(' ',1)[0], pic: req.user.photos[0]}
    } else if(req.session.passport.user.provider === 'facebook') {
      user = {name: req.user.name.givenName, pic: req.user.photos[0].value}
    }
    console.log('user', user);
  res.render('page',{ user: user});
});

module.exports = router;
