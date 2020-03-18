const express = require('express')
const router = express.Router();
const utils = require('../public/javascripts/utils');

router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us', user : utils.getLimitedUserContext(req.user) });
});

router.get('/map', (req, res) => {
    res.render('map', { title : 'Store Map', user : utils.getLimitedUserContext(req.user) });
});

router.get('/story', (req, res) => {
    res.render('story', { title: 'Our Story', user : utils.getLimitedUserContext(req.user) });
});

router.get('/passion', (req, res) => {
    res.render('passion', { titkle : 'Our Passion', user : utils.getLimitedUserContext(req.user) });
});

module.exports = router;