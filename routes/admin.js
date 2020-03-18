const express = require('express')
const router = express.Router();
const utils = require('../public/javascripts/utils');
const moment = require('../public/javascripts/moment');

const Designer = require('../models/designer');
const Listing = require('../models/listing');
const ListingOption = require('../models/listing-option');
const Order = require('../models/order');
const User = require('../models/user');
const PromoCode = require('../models/promo-code');

const mailer = require('../mail/mailer');

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
                                listing : utils.getSingleListingContext(listing),
                                option : utils.getSingleOptionContext(option),
                                size : item.size
                            };
                        } else {
                            result = {
                                listing : utils.getSingleListingContext(listing),
                                option : utils.getSingleOptionContext(option)
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
    if (!utils.isAdmin(req, res)) {
        return;
    }

    res.render('admin-home', { title : 'Admin Home', user : utils.getLimitedUserContext(req.user) });
});

router.get('/discounts', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    PromoCode.find({}, (err, codes) => {
        if (err) {
            throw err;
        }

        codes.sort((a, b) => a.created - b.created);

        res.render('admin-discounts', { title : 'Discounts', codes : utils.getPromoCodeContext(codes), user : utils.getLimitedUserContext(req.user) });
    });
});

router.post('/discounts/create', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    let {
        code,
        minCartValue,
        totalUses,
        percentDiscounted,
        dollarDiscounted,
        expireDays,
        expireHours,
        expireMinutes
    } = req.body;

    let expireDate = new Date();

    if (!minCartValue) { minCartValue = 0; }
    if (!totalUses) { totalUses = 99999; }
    if (!percentDiscounted) { percentDiscounted = 0; }
    if (!dollarDiscounted) { dollarDiscounted = 0; }
    if (!expireDays) { expireDays = 0; }
    if (!expireHours) { expireHours = 0; }
    if (!expireMinutes) { expireMinutes = 0; }

    if (expireDays > 0) {
        expireDate = moment(expireDate).add(expireDays, 'days').toDate();
    }

    if (expireHours > 0) {
        expireDate = moment(expireDate).add(expireHours, 'hours').toDate();
    }

    if (expireMinutes > 0) {
        expireDate = moment(expireDate).add(expireMinutes, 'minutes').toDate();
    }

    const newPromoCode = new PromoCode({
        code : code,
        minCartValue : minCartValue,
        percentDiscounted : percentDiscounted,
        dollarDiscounted : dollarDiscounted,
        remainingUses : totalUses,
        expire : expireDate
    });

    PromoCode.findOne({ code : code }, (err, code) => {
        if (err) {
            throw err;
        }

        if (code) {
            req.flash('error', 'Code with name "' + code + '" is already in use');
            res.redirect('/admin/discounts');
            return;
        }

        newPromoCode.save().then(() => {
            console.log('Discount code ' + newPromoCode._id + ' has been added');
            req.flash('success', 'Promo code "' + newPromoCode.code + '" has been created');
            res.redirect('/admin/discounts');
        });
    });
});

router.get('/discounts/delete/:id', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const id = req.params.id;

    PromoCode.deleteOne({ _id : id }, (err) => {
        if (err) {
            throw err;
        }

        console.log('Promo code "' + id + '" has been removed');
        req.flash('info', 'Promo code has been removed');
        res.redirect('/admin/discounts');
    });
});

router.get('/designers', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    Designer.find({}, (err, designers) => {
        if (err) {
            throw err;
        }

        designers.sort((a, b) => a.name.localeCompare(b.name));

        res.render('admin-designers', { title : 'Designers', designers : utils.getDesignerContext(designers), user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/listings', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    Listing.find({}, (err, listings) => {
        if (err) {
            throw err;
        }

        listings.sort((a, b) => a.name.localeCompare(b.name));

        res.render('admin-listings', { title : 'Listings', listings : utils.getListingContext(listings), user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/orders', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    Order.find({}, (err, orders) => {
        if (err) {
            throw err;
        }

        res.render('admin-orders', { title : 'Orders', orders : orders, user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/users', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    User.find({}, (err, users) => {
        if (err) {
            throw err;
        }

        res.render('admin-users', { title : 'Users', users : utils.getUsersContext(users), user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/users/:user/edit', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const userId = req.params.user;

    User.findById(userId, (err, result) => {
        if (err) {
            throw err;
        }

        if (!result || result === null) {
            req.flash('error', 'User not found');
            res.redirect('/admin/users');
            return;
        }

        Order.find({ owner : result._id }, (err, orders) => {
            if (err) {
                throw err;
            }

            console.log(utils.getFullUserContext(result));
    
            res.render('admin-users-edit', { title : 'Account: ' + result.firstName + ' ' + result.lastName, result : utils.getFullUserContext(result), orders : utils.getOrderContext(orders), user : utils.getLimitedUserContext(req.user) });
        });
    });
});

router.get('/listings/new', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const collections = [];

    Listing.find({}, (err, listings) => {
        if (err) {
            throw err;
        }

        for (var i = 0; i < listings.length; i++) {
            const listing = listings[i];

            if (listing.coll && !collections.includes(listing.coll)) {
                collections.push(listing.coll);
            }
        }

        Designer.find({}, (err, designers) => {
            if (err) {
                throw err;
            }

            res.render('admin-listings-new', { title : 'New Listing', designers : utils.getDesignerContext(designers), collections : collections, user : utils.getLimitedUserContext(req.user) });
        });
    });
});

router.get('/listings/:listing/options/new', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;

    Listing.findOne({ _id : listingId }, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listings');
            return;
        }

        res.render('admin-options-new', { title : 'New Option', listing : utils.getSingleListingContext(listing), user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/listings/:listing/edit', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;

    Listing.findOne({ _id : listingId }, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listings');
            return;
        }

        res.render('admin-listings-edit', { title : 'Edit Listing', listing : utils.getSingleListingContext(listing), user : utils.getLimitedUserContext(req.user) });
    });
});

router.get('/listings/:listing/options/:option/edit', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;
    const optionId = req.params.option;

    Listing.findOne({ 'options._id' : optionId }, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listings');
            return;
        }

        if (listing.options.length == 0) {
            req.flash('error', 'Listing does not have any options');
            res.redirect('/admin/listings/' + listingId + '/edit');
            return;
        }

        for (var i = 0; i < listing.options.length; i++) {
            const option = listing.options[i];

            if (option._id == optionId) {
                res.render('admin-options-edit', { title : 'Edit Option', listing : utils.getSingleListingContext(listing), option : utils.getSingleOptionContext(option), user : utils.getLimitedUserContext(req.user) });
                break;
            }
        }
    });
});

router.post('/listings/create', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const {
        name,
        designer,
        type,
        collection,
        description
    } = req.body;

    // TODO: Parse and check body arguments before creating

    const newListing = new Listing({
        name : name,
        designer : designer,
        type : type,
        coll : collection,
        description : description
    });

    newListing.save().then(() => {
        console.log('Listing ' + newListing._id + ' has been added');
        req.flash('success', 'Listing has been added');
        res.redirect('/admin/listings');
    });
});

router.post('/listings/:listing/options/create', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;

    const {
        identifier,
        sku,
        ordertype,
        metal,
        gemstone,
        sizes,
        cost,
        price,
        quantity
    } = req.body;

    const newOption = new ListingOption({
        identifier : identifier,
        sku : sku,
        ordertype : ordertype,
        metal : metal,
        gemstone : gemstone,
        sizes : sizes,
        cost : cost,
        price : price,
        quantity : quantity
    });

    Listing.findById(listingId, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listing');
            return;
        }

        listing.options.push(newOption);

        listing.save().then(() => {
            console.log('Added option ' + newOption._id + ' to listing ' + listingId);
            req.flash('success', 'Option has been created');
            res.redirect('/admin/listings/' + listingId + '/edit');
        });
    });
});

router.post('/listings/:listing/delete', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;
    console.log('a');

    Listing.deleteOne({ _id : listingId }, (err) => {
        if (err) {
            throw err;
        }

        console.log('b');
        req.flash('success', 'Listing has been deleted');
        res.redirect('/admin/listings');
        
        console.log('Listing "' + listingId + '" has been deleted');
    });
});

router.post('/listings/:listing/options/:option/delete', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;
    const optionId = req.params.option;

    Listing.findOne({ 'options._id' : optionId }, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listings');
            return;
        }

        if (listing.options.length == 0) {
            req.flash('error', 'This listing does not have any options');
            res.redirect('/admin/listings');
            return;
        }

        for (var i = 0; i < listing.options.length; i++) {
            const option = listing.options[i];

            if (option._id == optionId) {
                option.remove();

                listing.save().then(() => {
                    req.flash('info', 'Option has been deleted');
                    res.redirect('/admin/listings/' + listingId + '/edit');
                });

                break;
            }
        }
    });
});

router.post('/listings/:listing/update', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;

    const {
        name,
        collection,
        description,
        featured,
        priority
    } = req.body;

    const featuredValue = featured === 'yes' ? true : false;

    Listing.findById(listingId, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listings');
            return;
        }

        listing.name = name;
        listing.coll = collection;
        listing.description = description;
        listing.featured = featuredValue;
        listing.priority = priority;

        listing.save().then(() => {
            console.log('Lising ' + listingId + ' has been updated');
            req.flash('success', 'Listing has been updated successfully');
            res.redirect('/admin/listings/' + listingId + '/edit');
        });
    });
});

router.post('/listings/:listing/image/update', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;

    if (req.files == null || Object.keys(req.files).length == 0) {
        req.flash('error', 'No files were uploaded');
        res.redirect('/admin/listings/' + listingId + '/edit');
        return;
    }

    req.files.mainImageUpload.mv(__dirname + '/../public/images/product/' + listingId + '.png', (err) => {
        if (err) {
            throw err;
        }

        console.log('Main image for listing ' + listingId + ' has been changed');
        req.flash('success', 'File has been uploaded successfully');
        res.redirect('/admin/listings/' + listingId + '/edit');
    });
});

router.post('/listings/:listing/options/:option/update', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;
    const optionId = req.params.option;

    const {
        identifier,
        sku,
        ordertype,
        metal,
        gemstone,
        sizes,
        cost,
        price,
        quantity
    } = req.body;

    Listing.findOne({ 'options._id' : optionId }, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/admin/listings/');
            return;
        }

        for (var i = 0; i < listing.options.length; i++) {
            const option = listing.options[i];

            if (option._id == optionId) {
                option.identifier = identifier;
                option.sku = sku;
                option.ordertype = ordertype;
                option.metal = metal;
                option.gemstone = gemstone;
                option.sizes = sizes;
                option.cost = cost;
                option.price = price;
                option.quantity = quantity;

                listing.save().then(() => {
                    console.log('Option ' + optionId + ' for listing ' + listingId + ' has been updated');
                    req.flash('success', 'Option has been updated');
                    res.redirect('/admin/listings/' + listingId + '/options/' + optionId + '/edit');
                });

                break;
            }
        }
    });
});

router.post('/listings/:listing/options/:option/image/update', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const listingId = req.params.listing;
    const optionId = req.params.option;

    if (req.files == null || Object.keys(req.files).length == 0) {
        req.flash('error', 'No files were uploaded');
        res.redirect('/admin/listing' + listingId + '/options/' + optionId + '/edit');
        return;
    }

    req.files.optionImageUpload.mv(__dirname + '/../public/images/product/' + optionId + '.png', (err) => {
        if (err) {
            throw err;
        }

        console.log('Option image for listing ' + listingId + ' has been changed');
        req.flash('success', 'File has been uploaded successfully');
        res.redirect('/admin/listings/' + listingId + '/options/' + optionId + '/edit');
    });
});

router.post('/designers/create', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const name = req.body.name;

    Designer.findOne({ name : name }, (err, designer) => {
        if (err) {
            throw err;
        }

        if (designer) {
            req.flash('error', 'Designer name is already in use');
            res.redirect('/admin/designers');
            return;
        }

        const newDesigner = new Designer({ name : name });

        newDesigner.save().then(() => {
            console.log('Designer ' + name + ' has been added');
            req.flash('success', 'Designer has been added');
            res.redirect('/admin/designers');
        });
    });
});

router.post('/designers/:name/delete', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const name = req.params.name;

    Designer.deleteOne({ name : name }, (err) => {
        if (err) {
            throw err;
        }

        console.log('Designer ' + name + ' has been removed');
        req.flash('success', 'Designer has been removed');
        res.redirect('/admin/designers');
    });
});

router.get('/orders/:order/edit', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const orderId = req.params.order;

    Order.findById(orderId, (err, order) => {
        if (err) {
            throw err;
        }

        if (!order) {
            req.flash('error', 'Order not found');
            res.redirect('/admin/orders');
            return;
        }

        getItems(order, (results) => {
            if (!results) {
                req.flash('error', 'No results found');
                res.redirect('/admin/orders');
                return;
            }

            res.render('admin-orders-edit', { title : 'Order #' + order._id, order : order, results : results, user : utils.getLimitedUserContext(req.user) });
        });
    });
});

router.post('/orders/:order/edit/status/notify', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const orderId = req.params.order;

    Order.findById(orderId, (err, order) => {
        if (err) {
            throw err;
        }

        if (!order || order === null) {
            req.flash('error', 'Order not found');
            res.redirect('/admin/orders');
            return;
        }

        const status = order.status;

        if (status === 0) {
            mailer.sendEmail(
                order.contact_email,
                'Order Status #' + order.transaction,
                'order-status',
                context = {
                    status : 'Awaiting Approval',
                    tracking : order.shipping_tracking,
                    first_name : order.contact_firstname,
                    order_id : orderId,
                    transaction_id : order.transaction
                });
        } else if (status === 1) {
            mailer.sendEmail(
                order.contact_email,
                'Order Status #' + order.transaction,
                'order-status',
                context = {
                    status : 'Awaiting Shipment',
                    tracking : order.shipping_tracking,
                    first_name : order.contact_firstname,
                    order_id : orderId,
                    transaction_id : order.transaction
                });
        } else if (status === 2) {
            mailer.sendEmail(
                order.contact_email,
                'Order Status #' + order.transaction,
                'order-status',
                context = {
                    status : 'Shipped',
                    tracking : order.shipping_tracking,
                    first_name : order.contact_firstname,
                    order_id : orderId,
                    transaction_id : order.transaction
                });
        } else if (status === 3) {
            mailer.sendEmail(
                order.contact_email,
                'Order Status #' + order.transaction,
                'order-status',
                context = {
                    status : 'Completed',
                    tracking : order.shipping_tracking,
                    first_name : order.contact_firstname,
                    order_id : orderId,
                    transaction_id : order.transaction
                });
        } else if (status === 4) {
            mailer.sendEmail(
                order.contact_email,
                'Order Status #' + order.transaction,
                'order-status',
                context = {
                    status : 'Awaiting Custom Order',
                    tracking : order.shipping_tracking,
                    first_name : order.contact_firstname,
                    order_id : orderId,
                    transaction_id : order.transaction
                });
        }
        
        req.flash('success', 'Buyer has been sent a notification to their email');
        res.redirect('/admin/orders/' + orderId + '/edit');
    });
});

router.post('/orders/:order/edit/tracking/update', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const orderId = req.params.order;
    const value = req.body.trackingInput;

    Order.findById(orderId, (err, order) => {
        if (err) {
            throw err;
        }

        if (!order) {
            req.flash('error', 'Order not found');
            res.redirect('/admin/orders');
            return;
        }

        order.shipping_tracking = value;

        order.save().then(() => {
            req.flash('success', 'Order tracking number has been updated successfully');
            res.redirect('/admin/orders/' + orderId + '/edit');
            console.log('Order: ' + orderId + ' tracking has been updated to: ' + value);
        });
    });
});

router.post('/orders/:order/edit/status/update', (req, res) => {
    if (!utils.isAdmin(req, res)) {
        return;
    }

    const orderId = req.params.order;
    const value = req.body.statusInput;

    console.log('Value: ' + value);

    Order.findById(orderId, (err, order) => {
        if (err) {
            throw err;
        }

        if (!order) {
            req.flash('error', 'Order not found');
            res.redirect('/admin/orders');
            return;
        }

        order.status = value;
        
        order.save().then(() => {
            req.flash('success', 'Order status has been updated successfully');
            res.redirect('/admin/orders/' + orderId + '/edit');
            console.log('Order: ' + orderId + ' status has been updated to: ' + value);
        })
    });
});

module.exports = router;