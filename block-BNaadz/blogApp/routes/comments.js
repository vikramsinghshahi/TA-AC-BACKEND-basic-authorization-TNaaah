const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Article = require('../models/article');
const auth = require('../middlewares/auth');

router.use(auth.isUserLoggedIn);

// Form to edit comment
router.get('/:id/edit', (req, res, next) => {
  let commentId = req.params.id;

  Comment.findById(commentId)
    .populate('author', 'fullName')
    .exec((err, comment) => {
      if (err) return next(err);

      if (comment.author.id !== req.user.id) {
        req.flash('error', 'Please edit only those comments you have created.');
        return res.redirect(`/articles/${comment.articleId}`);
      }

      res.render('updateComment', { comment });
    });
});

// to update comment
router.post('/:id', (req, res, next) => {
  let commentId = req.params.id;

  Comment.findById(commentId)
    .populate('author', 'fullName')
    .exec((err, comment) => {
      if (err) return next(err);

      if (comment.author.id !== req.user.id) {
        req.flash('error', 'Please edit only those comments you have created.');
        return res.redirect(`/articles/${comment.articleId}`);
      }

      Comment.findByIdAndUpdate(commentId, req.body, (err, updatedComment) => {
        if (err) return next(err);
        res.redirect(`/articles/${updatedComment.articleId}`);
      });
    });
});

// to delete comment
router.get('/:id/delete', (req, res, next) => {
  let commentId = req.params.id;

  Comment.findById(commentId)
    .populate('author', 'fullName')
    .exec((err, comment) => {
      if (err) return next(err);

      if (comment.author.id !== req.user.id) {
        req.flash(
          'error',
          'Please delete only those comments you have created.'
        );
        return res.redirect(`/articles/${comment.articleId}`);
      }

      Comment.findByIdAndDelete(commentId, (err, deletedComment) => {
        if (err) return next(err);
        Article.findOneAndUpdate(
          { slug: deletedComment.articleId },
          { $pull: { comments: deletedComment.id } },
          (err, article) => {
            if (err) return next(err);
            res.redirect(`/articles/${deletedComment.articleId}`);
          }
        );
      });
    });
});

// to like a comment
router.get('/:id/like', (req, res, next) => {
  let id = req.params.id;
  Comment.findByIdAndUpdate(id, { $inc: { likes: 1 } }, (err, comment) => {
    if (err) return next(err);
    res.redirect(`/articles/${comment.articleId}`);
  });
});

// to dislike a comment
router.get('/:id/dislike', (req, res, next) => {
  let id = req.params.id;
  Comment.findByIdAndUpdate(id, { $inc: { likes: -1 } }, (err, comment) => {
    if (err) return next(err);
    res.redirect(`/articles/${comment.articleId}`);
  });
});

module.exports = router;