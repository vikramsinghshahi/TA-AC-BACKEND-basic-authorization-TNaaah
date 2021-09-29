var express = require('express');
var auth = require('../middlewares/auth');

var User = require('../models/User');
var Podcast = require('../models/Podcast');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('clientHomePage');
});

//client list of podcasts

router.get('/listOfPodcast/myOwn', auth.isClient, (req, res, next) => {
  Podcast.find({ createdBy: req.user.id }, (err, podcasts) => {
    if (err) return next(err);
    res.render('clientPodcastList', { podcasts });
  });
});

router.get('/listOfPodcast/:type', auth.isClient, (req, res, next) => {
  let type = req.params.type;
  if (type === 'free') {
    Podcast.find({ forUserType: 'free' }, (err, podcasts) => {
      if (err) return next(err);

      res.render('clientPodcastList', { podcasts });
    });
  } else if (type === 'vip') {
    Podcast.find({ forUserType: 'free' }, (err, freePodcasts) => {
      if (err) return next(err);
      Podcast.find({ forUserType: 'vip' }, (err, vipPodcasts) => {
        if (err) return next(err);
        let podcasts = vipPodcasts.concat(freePodcasts);
        res.render('clientPodcastList', { podcasts });
      });
    });
  } else if (type === 'premium') {
    Podcast.find({}, (err, podcasts) => {
      if (err) return next(err);

      res.render('clientPodcastList', { podcasts });
    });
  }
});

//client podcast details
router.get('/podcast/:id', auth.isClient, (req, res, next) => {
  let podcastId = req.params.id;
  Podcast.findById(podcastId)
    .populate('createdBy')
    .exec((err, podcast) => {
      if (err) return next(err);
      console.log(podcast);
      res.render('clientPodcastDetails', { podcast });
    });
});

//client create new podcast

router.get('/newPodcast', auth.isClient, (req, res, next) => {
  res.render('clientPodcastCreateForm');
});

router.post('/newPodcast', auth.isClient, (req, res, next) => {
  console.log(req.body, req.user);
  let data = req.body;
  data.forUserType = 'free';
  data.createdBy = req.user.id;
  Podcast.create(data, (err, podcast) => {
    if (err) return next(err);
    res.redirect('/client/listOfPodcast/' + req.user.userType);
  });
});

module.exports = router;