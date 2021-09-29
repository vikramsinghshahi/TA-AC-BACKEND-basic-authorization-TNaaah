var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const auth = require('../middlewares/auth');

// register router

router.get('/register', (req, res) => {
  let error = req.flash('error')[0];
  res.render('registerForm', { error });
});

router.post('/register', (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    // user exists
    if (user) {
      req.flash('error', 'Email already exists.');
      return res.redirect('/users/register');
    }

    // password is less than 4 chars
    if (req.body.password.length < 5 || req.body.password.length > 20) {
      req.flash('error', 'Password must be between 5 and 20 characters.');
      return res.redirect('/users/register');
    }

    // user does not exist
    User.create(req.body, (err, user) => {
      if (err) return next(err);
      res.redirect('/users/login');
    });
  });
});

// login router
router.get('/login', (req, res) => {
  let error = req.flash('error')[0];
  res.render('loginForm', { error });
});

router.post('/login', (req, res, next) => {
  let { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Email or password is not entered.');
    return res.redirect('/users/login');
  }

  // email validation
  User.findOne({ email }, (err, user) => {
    if (err) return next(err);

    if (!user) {
      req.flash('error', 'User is not registered.');
      return res.redirect('/users/login');
    }

    // email is valid, password check
    user.verifyPassword(password, (err, result) => {
      if (err) return next(err);

      if (!result) {
        req.flash('error', 'Password is incorrect.');
        return res.redirect('/users/login');
      }

      // password is valid, creating session
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      req.session.isBlocked = user.isBlocked;

      res.render('dashboard', { user, error: '' });
    });
  });
});

router.use(auth.isUserLoggedIn);

// logout router
router.get('/logout', (req, res, next) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.redirect('/users/login');
});

// dashboard redirects
router.get('/dashboard', (req, res, next) => {
  let error = req.flash('error')[0];
  res.render('dashboard', { error });
});

// admin routes

router.get('/all', auth.isAdmin, (req, res, next) => {
  User.find({}, 'name email isAdmin isBlocked', (err, users) => {
    if (err) return next(err);
    res.render('listUsers', { users });
  });
});

router.get('/:id/block', auth.isAdmin, (req, res, next) => {
  let id = req.params.id;
  User.findByIdAndUpdate(id, { $set: { isBlocked: true } }, (err, user) => {
    if (err) return next(err);
    res.redirect('/users/all');
  });
});

router.get('/:id/unblock', auth.isAdmin, (req, res, next) => {
  let id = req.params.id;
  User.findByIdAndUpdate(id, { $set: { isBlocked: false } }, (err, user) => {
    if (err) return next(err);
    res.redirect('/users/all');
  });
});

router.use(auth.isRegularUser);

// cart router
router.get('/:id/cart', (req, res, next) => {
  let id = req.params.id;
  User.findById(id)
    .populate('cart')
    .exec((err, user) => {
      if (err) return next(err);
      let prices = user.cart.map((item) => item.price);
      let totalPrice = prices.reduce((acc, price) => acc + price, 0);
      res.render('cart', { user, totalPrice });
    });
});

module.exports = router;
