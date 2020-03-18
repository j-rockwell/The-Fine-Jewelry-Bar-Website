const express = require('express');
const router = express.Router();
const utils = require('../public/javascripts/utils');

const Designer = require('../models/designer');

router.get('/', function(req, res) {
  Designer.find({}, (err, designers) => {
    if (err) {
      throw err;
    }

    designers.sort((a, b) => a.name.localeCompare(b.name));

    res.render('index', { title : 'The Fine Jewelry Bar', designers : utils.getDesignerContext(designers), user : utils.getLimitedUserContext(req.user) });
  });
});

module.exports = router;