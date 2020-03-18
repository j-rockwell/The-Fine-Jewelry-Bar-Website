const express = require('express');
const router = express.Router();
const utils = require('../public/javascripts/utils');

router.get('/', function(req, res) {
  res.render('lookbook', { title: 'Lookbook', user : utils.getLimitedUserContext(req.user) });
});

module.exports = router;