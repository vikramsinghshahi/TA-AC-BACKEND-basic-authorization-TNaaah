var express = require('express');
var auth = require('../middlewares/auth');
var User = require('../models/User');
var Podcast = require('../models/Podcast');
var router = express.Router();

router.get('/:id/edit', (req, res, next) => {
  let podcastId = req.params.id;
  Podcast.findById(podcastId)
    .populate('createdBy')
    .exec((err, podcast) => {
      if (err) return next(err);
      if (req.user.id !== podcast.createdBy.id) {
        return res.redirect('/admin/listOfPodcast');
      } else {
        res.render('AdminPodcastEditForm', { podcast });
      }
    });
});

router.post('/:id/edit', (req, res, next) => {
  let podcastId = req.params.id;
  Podcast.findByIdAndUpdate(podcastId, req.body, (err, updated) => {
    if (err) return next(err);
    if (req.user.userType === 'admin') {
      res.redirect('/admin/podcast/' + podcastId);
    } else {
      res.redirect('/client/podcast/' + podcastId);
    }
  });
});

//podcast delete

router.get('/:id/delete', (req, res, next) => {
  let podcastId = req.params.id;
  Podcast.findById(podcastId)
    .populate('createdBy')
    .exec((err, podcast) => {
      if (err) return next(err);
      if (req.user.id !== podcast.createdBy.id) {
        return res.redirect('/admin/listOfPodcast');
      } else {
        Podcast.findByIdAndDelete(podcastId, (err, deleted) => {
          if (err) return next(err);

          if (req.user.userType === 'admin') {
            return res.redirect('/admin/listOfPodcast');
          } else {
            res.redirect('/client/listOfPodcast/' + req.user.userType);
          }
        });
      }
    });
});

router.get('/:id/likes/:method', auth.isLoggedIn, (req, res, next) => {
  let podcastId = req.params.id;
  let method = req.params.method;

  if (method === 'like') {
    Podcast.findByIdAndUpdate(
      podcastId,
      { $inc: { likes: 1 } },
      (err, updated) => {
        if (err) return next(err);
        if (req.user.userType === 'admin') {
          res.redirect('/admin/podcast/' + podcastId);
        } else {
          res.redirect('/client/podcast/' + podcastId);
        }
      }
    );
  } else {
    Podcast.findByIdAndUpdate(
      podcastId,
      { $inc: { likes: -1 } },
      (err, updated) => {
        if (err) return next(err);
        if (req.user.userType === 'admin') {
          res.redirect('/admin/podcast/' + podcastId);
        } else {
          res.redirect('/client/podcast/' + podcastId);
        }
      }
    );
  }
});

module.exports = router;