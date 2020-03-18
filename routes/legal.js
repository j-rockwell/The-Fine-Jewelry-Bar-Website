const express = require('express')
const router = express.Router();
const utils = require('../public/javascripts/utils');

router.get('/', (req, res) => {
    res.render('legal', { title: 'Legal', user : utils.getLimitedUserContext(req.user) });
});

module.exports = router;