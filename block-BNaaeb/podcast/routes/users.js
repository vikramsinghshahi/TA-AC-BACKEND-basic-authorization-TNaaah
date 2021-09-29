var express = require('express');
var User = require('../models/User');

var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// register

router.get('/register', function (req, res, next) {
  res.render('register', { error: req.flash('error')[0] });
});

router.post('/register', (req, res, next) => {
  User.create(req.body, (err, user) => {
    if (err) {
      if (err.name === 'ValidationError') {
        req.flash('error', err.message);
        return res.redirect('/users/register');
      }
      req.flash('error', 'This email is taken');
      return res.redirect('/users/register');
      // return res.json({ err });
    }

    res.redirect('/users/login');
  });
});

// Login

router.get('/login', (req, res, next) => {
  var error = req.flash('error')[0];
  res.render('login', { error });
});

router.post('/login', (req, res, next) => {
  var { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Email/Password required');
    return res.redirect('/users/login');
  }
  User.findOne({ email }, (err, user) => {
    if (err) return next(err);
    // no user
    if (!user) {
      req.flash('error', 'This email is not registered');
      return res.redirect('/users/login');
    }
    // compare password
    user.verifyPassword(password, (err, result) => {
      if (err) return next(err);
      if (!result) {
        req.flash('error', 'Invalid Password');
        return res.redirect('/users/login');
      }
      // persist login user info
      req.session.userId = user.id;
      req.session.userType = user.userType;
      res.redirect('/home');
    });
  });
});

// Logout

router.get('/logout', (req, res, next) => {
  if (!req.session) {
    req.flash('error', 'You must login first');
    res.redirect('/users/login');
  } else {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/users/login');
  }
});

module.exports = router;
