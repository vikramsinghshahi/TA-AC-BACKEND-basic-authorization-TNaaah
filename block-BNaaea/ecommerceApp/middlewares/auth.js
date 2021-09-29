const e = require('express');
const User = require('../models/user');

module.exports = {
  isUserLoggedIn: function (req, res, next) {
    if (req.session && req.session.userId) {
      next();
    } else {
      res.redirect('/users/login');
    }
  },

  isAdmin: (req, res, next) => {
    if (req.session.userId && req.session.isAdmin) {
      next();
    } else if (req.session.userId) {
      req.flash('error', 'You are not authorized to view this page');
      res.redirect('/users/dashboard');
    } else {
      req.flash('error', 'Please login to view content');
      res.redirect('/users/login');
    }
  },

  isRegularUser: (req, res, next) => {
    if (req.session.userId && !req.session.isAdmin) {
      next();
    } else if (req.session.userId) {
      req.flash('error', 'You are not authorized to view this page');
      res.redirect('/users/dashboard');
    } else {
      req.flash('error', 'Please login to view content');
      res.redirect('/users/login');
    }
  },

  userInfo: (req, res, next) => {
    let userId = req.session && req.session.userId;
    if (userId) {
      User.findById(userId, (err, user) => {
        req.user = user;
        res.locals.user = user;
        next();
      });
    } else {
      req.user = null;
      res.locals.user = null;
      next();
    }
  },
};