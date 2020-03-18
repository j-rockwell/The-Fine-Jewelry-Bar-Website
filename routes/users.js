const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const mailer = require('../mail/mailer');
const utils = require('../public/javascripts/utils');

const User = require('../models/user');

const { forwardAuth } = require('../config/auth');

router.get('/login', forwardAuth, (req, res) => res.render('login', { title : 'Sign In', user : utils.getLimitedUserContext(req.user) }));

router.get('/register', forwardAuth, (req, res) => res.render('register', { title : 'Create Account', user : utils.getLimitedUserContext(req.user) }));

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('info', 'You have successfully signed out of your account');
    res.redirect('/users/login');
});

router.post('/register', (req, res) => {
    const { firstName, lastName, email, password, password2, newsletter } = req.body;
    const newsletterValue = newsletter === 'on' ? true : false;
    let errors = [];
    let error = '';

    if (firstName && !firstName.match(/[a-z]/i)) {
        errors.push('First name must only contain characters A-Z');
    }

    if (lastName && !lastName.match(/[a-z]/i)) {
        errors.push('Last name must only contain characters A-Z');
    }

    if (firstName.length > 32) {
        errors.push('First name must be less than 32 characters long');
    }

    if (lastName.length > 32) {
        errors.push('Last name must be less than 32 characters long');
    }

    if (password != password2) {
        errors.push('Passwords do not match');
    }

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (password.legnth > 32) {
        errors.push('Password must be less than 32 characters');
    }

    if (errors.length > 0) {
        if (errors.length == 1) {
            error = errors.toString();
        } else {
            error = errors.join(' and ');
        }

        req.flash('error', error);
        res.redirect('/users/register');
    } else {
        User.findOne({ email : email }).then(user => {
            if (user) {
                errors.push('Email ' + email + " is already in use");
                
                if (errors.length == 1) {
                    error = errors.toString();
                } else {
                    error = errors.join(' and ');
                }
        
                req.flash('error', error);
                res.redirect('/users/register');
            } else {
                const newUser = new User({
                    firstName,
                    lastName,
                    email,
                    password,
                    newsletterValue
                });

                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        throw err;
                    }
                    
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) {
                            throw err;
                        }

                        newUser.password = hash;
                        
                        newUser.save().then(() => {
                            req.logIn(newUser, (err) => {
                                if (err) {
                                    throw err;
                                }

                                mailer.sendEmail(email, 'Welcome to The Fine Jewelry Bar', 'welcome', context = { id : newUser._id, firstName : firstName, lastName : lastName, email : email });

                                req.flash('success', 'Your account has been created, Welcome to The Fine Jewelry Bar!');
                                return res.redirect('/users/login');
                            });
                        })
                    });
                });
            }
        });
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', function(err, user) {
        if (err) {
            throw err;
        }

        if (!user) {
            req.flash('error', 'Email/Password does not match');
            res.redirect('/users/login');
            return;
        }

        req.logIn(user, function(err) {
            if (err) {
                throw err;
            }

            return res.redirect('/');
        });
    })(req, res, next);
});

router.post('/register/:listing/:option', (req, res) => {
    const { firstName, lastName, email, password, password2, newsletter } = req.body;
    const newsletterValue = newsletter === 'on' ? true : false;
    let errors = [];
    let error = '';

    if (firstName && !firstName.match(/[a-z]/i)) {
        errors.push('First name must only contain characters A-Z');
    }

    if (lastName && !lastName.match(/[a-z]/i)) {
        errors.push('Last name must only contain characters A-Z');
    }

    if (firstName.length > 32) {
        errors.push('First name must be less than 32 characters long');
    }

    if (lastName.length > 32) {
        errors.push('Last name must be less than 32 characters long');
    }

    if (password != password2) {
        errors.push('Passwords do not match');
    }

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (password.legnth > 32) {
        errors.push('Password must be less than 32 characters');
    }

    if (errors.length > 0) {
        if (errors.length == 1) {
            error = errors.toString();
        } else {
            error = errors.join(' and ');
        }

        req.flash('error', error);
        res.redirect('/users/register');
    } else {
        User.findOne({ email : email }).then(user => {
            if (user) {
                errors.push('Email ' + email + " is already in use");
                
                if (errors.length == 1) {
                    error = errors.toString();
                } else {
                    error = errors.join(' and ');
                }
        
                req.flash('error', error);
                res.redirect('/users/register');
            } else {
                const newUser = new User({
                    firstName,
                    lastName,
                    email,
                    password,
                    newsletterValue
                });

                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        throw err;
                    }
                    
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) {
                            throw err;
                        }

                        newUser.password = hash;
                        
                        newUser.save().then(() => {
                            req.logIn(newUser, (err) => {
                                if (err) {
                                    throw err;
                                }

                                mailer.sendEmail(email, 'Welcome to The Fine Jewelry Bar', 'welcome', context = { id : newUser._id, firstName : firstName, lastName : lastName, email : email });

                                req.flash('success', 'Your account has been created. You can now add items to your cart.');
                                return res.redirect('/store/listing/' + req.params.listing + '/' + req.params.option);
                            });
                        })
                    });
                });
            }
        });
    }
});

router.post('/login/:listing/:option', (req, res, next) => {
    const listing = req.params.listing, option = req.params.option;
    
    passport.authenticate('local', (err, user) => {
        if (err) {
            throw err;
        }

        if (!user) {
            req.flash('error', 'Email/Password does not match');
            res.redirect('/store/listing/' + listing + '/' + option);
            return;
        }

        req.logIn(user, (err) => {
            if (err) {
                throw err;
            }

            req.flash('success', 'You are now signed in and can add items to your cart');
            return res.redirect('/store/listing/' + listing + '/' + option);
        });
    })(req, res, next);
});

module.exports = router;