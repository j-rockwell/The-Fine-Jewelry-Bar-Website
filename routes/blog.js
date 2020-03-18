var express = require('express');
var router = express.Router();
const utils = require('../public/javascripts/utils');

router.get('/', (req, res) => {
    res.render('blog', { title : 'Blog', user : utils.getLimitedUserContext(req.user) });
});

module.exports = router;