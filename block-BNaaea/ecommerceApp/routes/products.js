var express = require('express');
var router = express.Router();
const url = require('url');
const Product = require('../models/product');
const User = require('../models/user');
const auth = require('../middlewares/auth');

// get all products
router.get('/', (req, res, next) => {
  let categories;
  let parsedUrl = url.parse(req.url, true);
  let query = parsedUrl.query;

  Product.find({}, (err, products) => {
    if (err) return next(err);
    categories = new Set(products.map((product) => product.category).flat());

    if (parsedUrl.path === '/' || query.category === 'all') {
      res.render('listProducts', { products, categories });
    } else if (query.category) {
      Product.find({ category: query.category }, (err, products) => {
        if (err) return next(err);
        res.render('listProducts', { products, categories });
      });
    }
  });
});

// create a new product
router.get('/new', auth.isAdmin, (req, res, next) => {
  return res.render('productForm');
});

router.post('/', auth.isAdmin, (req, res, next) => {
  Product.create(req.body, (err, product) => {
    if (err) return next(err);
    res.redirect('/products');
  });
});

// get details of single product
router.get('/:id', (req, res, next) => {
  let id = req.params.id;
  Product.findById(id, (err, product) => {
    if (err) return next(err);
    let userId = req.session.userId;
    User.findById(userId, (err, user) => {
      if (err) return next(err);
      let error = req.flash('error')[0];
      res.render('productDetail', { product, user, error });
    });
  });
});

// Admin routes

// edit router
router.get('/:id/edit', auth.isAdmin, (req, res, next) => {
  let id = req.params.id;
  if (!req.session.isAdmin) {
    req.flash('error', 'You are not authorized to view this page');
    return res.redirect('/users/dashboard');
  }
  Product.findById(id, (err, product) => {
    if (err) return next(err);
    let userId = req.session.userId;
    User.findById(userId, (err, user) => {
      if (err) return next(err);
      res.render('productEdit', { product, user });
    });
  });
});

router.post('/:id', auth.isAdmin, (req, res, next) => {
  let id = req.params.id;
  req.body.category = req.body.category.split(',');
  Product.findByIdAndUpdate(id, req.body, (err, product) => {
    if (err) return next(err);
    res.redirect(`/products/${id}`);
  });
});

// delete product
router.get('/:id/delete', auth.isAdmin, (req, res, next) => {
  let id = req.params.id;
  Product.findByIdAndDelete(id, (err, deletedProduct) => {
    if (err) return next(err);

    User.updateMany({ cart: id }, { $pull: { cart: id } }, (err, user) => {
      if (err) return next(err);
      res.redirect('/products');
    });
  });
});

router.use(auth.isRegularUser);

// like the product
router.get('/:id/like', (req, res, next) => {
  let id = req.params.id;
  let userId = req.session.userId;

  User.findById(userId, (err, user) => {
    if (err) return next(err);

    if (user.isBlocked) {
      req.flash('error', 'Action is not permitted');
      return res.redirect(`/products/${id}`);
    } else {
      Product.findByIdAndUpdate(id, { $inc: { likes: 1 } }, (err, product) => {
        if (err) return next(err);
        res.redirect(`/products/${id}`);
      });
    }
  });
});

// dislike the product
router.get('/:id/dislike', (req, res, next) => {
  let id = req.params.id;
  let userId = req.session.userId;

  User.findById(userId, (err, user) => {
    if (err) return next(err);

    if (user.isBlocked) {
      req.flash('error', 'Action is not permitted');
      return res.redirect(`/products/${id}`);
    } else {
      Product.findByIdAndUpdate(id, { $inc: { likes: -1 } }, (err, product) => {
        if (err) return next(err);
        res.redirect(`/products/${id}`);
      });
    }
  });
});

// add to cart
router.get('/:id/cart', (req, res, next) => {
  let productId = req.params.id;
  let userId = req.session.userId;

  User.findById(userId, (err, user) => {
    if (err) return next(err);

    if (user.isBlocked) {
      req.flash('error', 'Action is not permitted');
      return res.redirect(`/products/${productId}`);
    } else {
      User.findByIdAndUpdate(
        userId,
        { $push: { cart: productId } },
        (err, user) => {
          if (err) return next(err);
          Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: -1 } },
            (err, product) => {
              if (err) return next(err);
              res.redirect(`/products/${productId}`);
            }
          );
        }
      );
    }
  });
});

module.exports = router;