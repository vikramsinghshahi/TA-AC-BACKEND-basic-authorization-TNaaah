var express = require('express');
var router = express.Router();
const Article = require('../models/article');
const Comment = require('../models/comment');
const auth = require('../middlewares/auth');

/* GET articles listing. */
router.get('/', function (req, res, next) {
  Article.find({}, (err, articles) => {
    if (err) return next(err);
    res.render('articles', { articles: articles });
  });
});

// route to render form to create new article
router.get('/new', auth.isUserLoggedIn, (req, res) => {
  res.render('articleForm');
});

// router for user articles
router.get('/my-articles', auth.isUserLoggedIn, (req, res, next) => {
  let userId = req.user.id;
  Article.find({ author: userId }, (err, articles) => {
    if (err) return next(err);
    res.render('articles', { articles });
  });
});

router.get('/:slug', (req, res, next) => {
  let slug = req.params.slug;
  Article.findOne({ slug })
    .populate('author', 'fullName')
    .populate({
      path: 'comments',
      populate: { path: 'author', select: 'fullName' },
    })
    .exec((err, article) => {
      if (err) next(err);
      let error = req.flash('error')[0];
      let articleError = req.flash('articleError')[0];
      res.render('singleArticle', { article, error, articleError });
    });
});

router.use(auth.isUserLoggedIn);

router.post('/', (req, res, next) => {
  req.body.author = req.user.id;

  Article.create(req.body, (err, insertedArticle) => {
    if (err) next(err);
    res.redirect('/articles');
  });
});

router.get('/:slug/edit', (req, res, next) => {
  let slug = req.params.slug;
  Article.findOne({ slug })
    .populate('author', 'fullName')
    .exec((err, article) => {
      if (err) next(err);

      if (article.author.id !== req.user.id) {
        req.flash('articleError', `You cannot edit another user's post.`);
        return res.redirect(`/articles/${slug}`);
      }

      res.render('editArticle', { article });
    });
});

router.post('/:slug', (req, res, next) => {
  let slug = req.params.slug;
  Article.findOne({ slug })
    .populate('author', 'fullName')
    .exec((err, article) => {
      if (err) next(err);

      if (article.author.id !== req.user.id) {
        req.flash('articleError', `You cannot edit another user's post.`);
        return res.redirect(`/articles/${slug}`);
      }

      Article.findOneAndUpdate({ slug }, req.body, (err, updatedArticle) => {
        if (err) next(err);
        res.redirect(`/articles/${updatedArticle.slug}`);
      });
    });
});

router.get('/:slug/delete', (req, res, next) => {
  let slug = req.params.slug;
  Article.findOne({ slug })
    .populate('author', 'fullName')
    .exec((err, article) => {
      if (err) next(err);

      if (article.author.id !== req.user.id) {
        req.flash('articleError', `You cannot delete another user's post.`);
        return res.redirect(`/articles/${slug}`);
      }

      Article.findOneAndDelete({ slug }, (err, deletedArticle) => {
        if (err) next(err);
        Comment.deleteMany({ articleId: deletedArticle.id }, (err, info) => {
          if (err) return next(err);
          res.redirect('/articles');
        });
      });
    });
});

// Like/Dislike button controls - Book
router.get('/:id/like', (req, res, next) => {
  let id = req.params.id;
  Article.findByIdAndUpdate(id, { $inc: { likes: 1 } }, (err, article) => {
    if (err) return next(err);
    res.redirect(`/articles/${article.slug}`);
  });
});

router.get('/:id/dislike', (req, res, next) => {
  let id = req.params.id;
  Article.findByIdAndUpdate(id, { $inc: { likes: -1 } }, (err, article) => {
    if (err) return next(err);
    res.redirect(`/articles/${article.slug}`);
  });
});

// Create Comment
router.post('/:slug/comments', (req, res, next) => {
  let articleSlug = req.params.slug;
  req.body.articleId = articleSlug;
  req.body.author = req.user.id;
  Comment.create(req.body, (err, comment) => {
    if (err) return next(err);
    Article.findOneAndUpdate(
      { slug: articleSlug },
      { $push: { comments: comment.id } },
      (err, updatedArticle) => {
        if (err) return next(err);
        res.redirect(`/articles/${updatedArticle.slug}`);
      }
    );
  });
});

module.exports = router;