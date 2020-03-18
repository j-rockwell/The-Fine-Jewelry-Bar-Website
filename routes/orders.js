const express = require('express')
const router = express.Router();
const utils = require('../public/javascripts/utils');

const Order = require('../models/order');
const Listing = require('../models/listing');

function checkPermissions(req, res, order) {
    if (!req.user || (!req.user.admin && order.owner != req.user._id)) {
        req.flash('error', 'You do not have permission to view this order');
        res.redirect('/');
        return false;
    }

    return true;
}

function attemptOrderAccess(req, res) {
    if (!req.user) {
        req.flash('error', 'You must be signed in to access your orders');
        res.redirect('/');
        return false;
    }

    return true;
}

function getOrders(req, callback) {
    Order.find({ owner : req.user._id }, (err, orders) => {
        if (err) {
            throw err;
        }

        callback(orders);
    });
}

function getItems(order, callback) {
    const optionIds = [];

    for (var i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        optionIds.push(item.option);
    }

    Listing.find({ 'options._id' : { $in : optionIds }}, (err, listings) => {
        if (err) {
            throw err;
        }

        let results = [];

        for (var a = 0; a < listings.length; a++) {
            const listing = listings[a];

            for (var b = 0; b < listing.options.length; b++) {
                const option = listing.options[b];

                for (var c = 0; c < order.items.length; c++) {
                    const item = order.items[c];

                    if (item.option == option._id) {
                        let result;

                        if (item.size) {
                            result = {
                                listing : listing,
                                option : option,
                                size : item.size
                            };
                        } else {
                            result = {
                                listing : listing,
                                option : option
                            };
                        }

                        results.push(result);
                    }
                }
            }
        }

        callback(results);
    });
}

router.get('/', (req, res) => {
    if (!attemptOrderAccess(req, res)) {
        return;
    }
    
    getOrders(req, orders => {
        res.render('order-list', { title : 'Your Orders', orders : utils.getOrderContext(orders), user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;

    Order.findOne({ _id : id }, (err, order) => {
        if (err) {
            throw err;
        }

        if (!checkPermissions(req, res, order)) {
            return;
        }

        if (!order || order === null) {
            req.flash('error', 'Order not found');
            res.redirect('/orders');
        }

        getItems(order, (items) => {
            res.render('order', { title : 'Your Order', order : utils.getOrderContext(orders), items : items, user : utils.getLimitedUserContext(req.user) });
        });
    });
});

module.exports = router;