var express = require('express');
var auth = require('../middlewares/auth');
var router = express.Router();

/* GET home page. */
router.get('/', auth.isLoggedIn, function (req, res, next) {
  let userType = req.user.userType;
  if (userType === 'admin') {
    return res.redirect('/admin');
  } else if (
    userType === 'vip' ||
    userType === 'premium' ||
    userType === 'free'
  ) {
    return res.redirect('/client');
  }

  return res.redirect('/users/login');
});

module.exports = router;