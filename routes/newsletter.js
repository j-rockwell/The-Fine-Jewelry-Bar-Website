const express = require('express')
const router = express.Router();
const utils = require('../public/javascripts/utils');

const User = require('../models/user');

router.get('/', function(req, res) {
    res.render('newsletter', { title: 'Newsletter', user : utils.getLimitedUserContext(req.user) });
});

router.get('/subscribe/:id', (req, res) => {
    const id = req.params.id;

    User.findOne({ _id : id }, (err, user) => {
        if (err) {
            throw err;
        }

        if (!user) {
            req.flash('error', 'User not found');
            res.redirect('/');
            return;
        }

        if (user.newsletter) {
            req.flash('error', 'This account is already receiving newsletter emails');
            res.redirect('/');
            return;
        }

        user.newsletter = true;

        user.save().then(() => {
            console.log(user.email + ' has subscribed to newsletter emails');
            req.flash('success', 'Account with the email "' + user.email + '" will now receive newsletter emails');
            res.redirect('/');
        });
    });
});

router.get('/unsubscribe/:id', (req, res) => {
    const id = req.params.id;

    User.findOne({ _id : id }, (err, user) => {
        if (err) {
            throw err;
        }

        if (!user) {
            req.flash('error', 'User not found');
            res.redirect('/');
            return;
        }

        if (!user.newsletter) {
            req.flash('error', 'This account is not receiving newsletter emails');
            res.redirect('/');
            return;
        }

        user.newsletter = false;

        user.save().then(() => {
            console.log(user.email + ' has unsubscribed from newsletter emails');
            req.flash('success', 'Account with the email "' + user.email + '" will no longer receive newsletter emails');
            res.redirect('/');
        });
    });
});

module.exports = router;