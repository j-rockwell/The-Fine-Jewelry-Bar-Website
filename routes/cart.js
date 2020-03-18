const express = require('express');
const router = express.Router();
const utils = require('../public/javascripts/utils');

const Listing = require('../models/listing');
const CartItem = require('../models/cart-item');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');
const PromoCode = require('../models/promo-code');

const ApiContracts = require('authorizenet').APIContracts;
const ApiControllers = require('authorizenet').APIControllers;
const SDKConstants = require('authorizenet').Constants;
const authorize = require('../config/authorize');

const mailer = require('../mail/mailer');

/**
 * Returns false if user is not signed in
 * @param {*} req 
 * @param {*} res 
 */
function attemptCartAccess(req, res) {
    if (!req.user) {
        req.flash('error', 'You must be signed in to access your cart');
        res.redirect('/');
        return false;
    }

    return true;
}

/**
 * Returns a callback containing an array of custom objects containing the listing, option and size
 * @param {*} req 
 * @param {*} callback 
 */
function getCart(req, callback) {
    const optionIds = [];

    for (var i = 0; i < req.user.cart.length; i++) {
        const item = req.user.cart[i];
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

                for (var c = 0; c < req.user.cart.length; c++) {
                    const item = req.user.cart[c];

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

// CART PAGE
router.get('/', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    getCart(req, (results) => {
        const options = [];

        for (var i = 0; i < results.length; i++) {
            options.push(results[i].option);
        }

        res.render('cart', { title : 'Your Cart', user : utils.getLimitedUserContext(req.user), results : results, options : options });
    });
});

// CHECKOUT PAGE
router.get('/checkout', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    getCart(req, (results) => {
        const options = [];
        let subtotal = 0;
        let taxes = 0;
        let total = 0;

        for (var i = 0; i < results.length; i++) {
            const option = results[i].option;

            subtotal += option.price;

            options.push(option);
        }

        taxes = subtotal * 0.0775;
        total = subtotal + taxes;

        res.render('checkout', { 
            title : 'Checkout',
            user : utils.getLimitedUserContext(req.user),
            subtotal : subtotal,
            taxes : taxes,
            total : total,
            results : results,
            options : options
        });
    });
});

router.get('/checkout/:code', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    const param = req.params.code;

    if (!param.includes('code=')) {
        req.flash('error', 'Invalid code value');
        res.redirect('/cart/checkout');
        return;
    }

    const code = param.replace('code=', '');

    PromoCode.findOne({ code : code }, (err, promoCode) => {
        if (err) {
            throw err;
        }

        if (!promoCode) {
            req.flash('error', 'Invalid code');
            res.redirect('/cart/checkout');
            return;
        }

        getCart(req, (results) => {
            const options = [];
            let subtotal = 0;
            let taxes = 0;
            let total = 0;
            let undiscounted = 0;
            let saved = 0;

            for (var i = 0; i < results.length; i++) {
                const option = results[i].option;

                subtotal += option.price;
                undiscounted += option.price;

                options.push(option);
            }

            if (promoCode.percentDiscounted > 0) {
                subtotal = subtotal - (subtotal * promoCode.percentDiscounted);
            }

            if (promoCode.dollarDiscounted > 0) {
                subtotal = subtotal - promoCode.dollarDiscounted;
            }

            taxes = subtotal * 0.0775;
            total = subtotal + taxes;
            undiscounted = undiscounted + (undiscounted * 0.0775);
            saved = undiscounted - total;

            console.log(utils.getSinglePromoCodeContext(promoCode));

            res.render('checkout', { 
                title : 'Checkout',
                user : utils.getLimitedUserContext(req.user),
                code : promoCode.code,
                subtotal : subtotal,
                taxes : taxes,
                total : total,
                saved : saved,
                results : results,
                options : options
            });
        });
    });
});

/*
    POST REQUESTS
*/

// ADD OPTION REQ
router.post('/add/:listing/:option', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    const listingId = req.params.listing;
    const optionId = req.params.option;
    const size = req.body.size;

    Listing.findOne({ _id : listingId, "options._id" : optionId }, (err, listing) => {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/store/listing/' + listingId + '/options/' + optionId);
            return;
        }

        let newCartItem;

        if (size) {
            newCartItem = new CartItem({
                listing : listingId,
                option : optionId,
                size : size
            });
        } else {
            newCartItem = new CartItem({
                listing : listingId,
                option : optionId
            });
        }

        if (req.user.cart && req.user.cart.length > 0) {
            for (var i = 0; i < req.user.cart.length; i++) {
                const cartItem = req.user.cart[i];

                if (cartItem.listing == listingId && cartItem.option == optionId && (size && cartItem.size == size)) {
                    req.flash('error', 'This item is already in your cart');
                    res.redirect('/');
                    return;
                }
            }
        }

        req.user.cart.push(newCartItem);

        req.user.save().then(() => {
            req.flash('success', 'Item has been added to your cart');
            res.redirect('/store/listing/' + listingId + '/' + optionId);
        });
    });
});

// DELETE OPTION REQ
router.post('/delete/:listing/:option/', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    var spliced = false;

    for (var i = 0; i < req.user.cart.length; i++) {
        const item = req.user.cart[i];

        if (item.listing == req.params.listing && item.option == req.params.option) {
            req.user.cart.splice(i, 1);
            spliced = true;
            break;
        }
    }

    if (!spliced) {
        req.flash('error', 'Item is not in your cart');
        res.redirect('/cart');
        return;
    }

    req.user.save().then(() => {
        req.flash('info', 'Item has been removed from your cart');
        res.redirect('/cart')
    });
});

// DELETE OPTION W/ SIZE REQ
router.post('/delete/:listing/:option/:size', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    var spliced = false;

    for (var i = 0; i < req.user.cart.length; i++) {
        const item = req.user.cart[i];

        if (item.listing == req.params.listing && item.option == req.params.option && item.size == req.params.size) {
            console.log('SPLICED: ' + item.listing + " = " + req.params.listing);
            req.user.cart.splice(i, 1);
            spliced = true;
            break;
        }
    }

    if (!spliced) {
        req.flash('error', 'Item is not in your cart');
        res.redirect('/cart');
        return;
    }

    req.user.save().then(() => {
        req.flash('info', 'Item has been removed from your cart');
        res.redirect('/cart')
    });
});

// ADD PROMO CODE
router.post('/code/add', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    const code = req.body.promoCode;

    PromoCode.findOne({ code : code }, (err, promoCode) => {
        if (err) {
            throw err;
        }

        if (!promoCode) {
            req.flash('error', 'Invalid promo code');
            res.redirect('/cart/checkout');
            return;
        }

        getCart(req, (results) => {
            const options = [];
            const date = new Date();
            let total = 0;

            for (var i = 0; i < results.length; i++) {
                const option = results[i].option;
                total += option.price;
                options.push(option);
            }

            if (promoCode.minCartValue > 0 && promoCode.minCartValue > total) {
                req.flash('error', 'This discount code requires a cart value greater than $' + promoCode.minCartValue);
                res.redirect('/cart/checkout');
                return;
            }

            if (promoCode.remainingUses <= 0) {
                req.flash('error', 'This code has expired A');
                res.redirect('/cart/checkout');
                return;
            }

            if (utils.isExpired(date, promoCode.expire)) {
                req.flash('error', 'This code has expired B');
                res.redirect('/cart/checkout');
                return;
            }

            req.flash('success', 'Successfully applied promo code to your cart');
            res.redirect('/cart/checkout/code=' + code);
        });
    });
});

// CHARGE REQ
router.post('/checkout/charge/', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    const { 
        shipping_firstname, shipping_lastname, shipping_address, shipping_city, shipping_state, shipping_zip,
        contact_firstname, contact_lastname, contact_email, contact_phone,
        card_number, expmo, expyr, csv, bill_address, bill_city, bill_state, bill_zip 
    } = req.body;

    let errors = [];
    let error = '';

    if (!shipping_firstname.match(/[a-z]/i)) {
        errors.push('First name for Shipping Address must only contain characters A-Z');
    }

    if (!shipping_lastname.match(/[a-z]/i)) {
        errors.push('Last name for Shipping Address must only contain characters A-Z');
    }

    if (shipping_firstname.length > 32) {
        errors.push('First name for Shipping Address must be less than 32 characters long');
    }

    if (shipping_lastname.length > 32) {
        errors.push('Last name for Shipping Address must be less than 32 characters long');
    }

    if (!shipping_city.match(/[a-z]/i)) {
        errors.push('City for Shipping Address must only contain characters A-Z');
    }

    if (isNaN(shipping_zip)) {
        errors.push('Zip code for Shipping Address must be a number');
    }

    if (!contact_firstname.match(/[a-z]/i)) {
        errors.push('First name for Contact Information must only contain characters A-Z');
    }

    if (!contact_lastname.match(/[a-z]/i)) {
        errors.push('Last name for Contact Information must only contain characters A-Z');
    }

    if (contact_firstname.length > 32) {
        errors.push('First name for Contact Information must be less than 32 characters long');
    }

    if (contact_lastname.length > 32) {
        errors.push('Last name for Contact Information must be less than 32 characters long');
    }

    if (!contact_email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
        errors.push('Email must be a valid format');
    }

    if (contact_phone && !contact_phone.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im)) {
        errors.push('Phone number for Contact Information must be a valid format');
    }

    if (isNaN(card_number)) {
        errors.push('Invalid credit card number');
    }

    if (isNaN(expmo)) {
        errors.push('Invalid expire month');
    }

    if (isNaN(expyr)) {
        errors.push('Invalid expire year');
    }

    if (isNaN(csv)) {
        errors.push('Invalid CSV');
    }

    if (errors.length > 0) {
        error = errors.join('\n');

        req.flash('error', error);
        res.redirect('/cart/checkout');

        return;
    }

    getCart(req, (results) => {
        let amount = 0;
        const items = [];

        for (var i = 0; i < results.length; i++) {
            const result = results[i];
            let context;

            if (result.size && result.size !== null) {
                context = {
                    listing : result.listing,
                    option : result.option,
                    size : result.size
                };
            } else {
                context = {
                    listing : result.listing,
                    option : result.option
                };
            }

            amount += result.option.price;

            items.push(context);
        }

        // MERCHANT LOGIN
        const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(authorize.apiLoginKey);
        merchantAuthenticationType.setTransactionKey(authorize.transactionKey);

        // CREDIT CARD
        const card = new ApiContracts.CreditCardType();
        card.setCardNumber(card_number);
        card.setExpirationDate(expmo + expyr);
        card.setCardCode(csv);

        // SET PAYMENT TYPE TO CREDIT CARD
        const paymentType = new ApiContracts.PaymentType();
        paymentType.setCreditCard(card);

        // ORDER DETAILS
        const orderDetails = new ApiContracts.OrderType();
        orderDetails.setDescription('Purchase @ The Fine Jewelry Bar');

        // TAXES
        const tax = new ApiContracts.ExtendedAmountType();

        if (shipping_state === 'CA') {
            tax.setAmount(Math.round(amount * 0.0775));
            tax.setName('California Sales Tax');
        } else {
            tax.setAmount(0);
        }

        // BILLING TO
        const billTo = new ApiContracts.CustomerAddressType();
        billTo.setFirstName(contact_firstname);
        billTo.setLastName(contact_lastname);
        billTo.setAddress(bill_address);
        billTo.setCity(bill_city);
        billTo.setState(bill_state);
        billTo.setZip(bill_zip);

        // SHIPPING TO
        const shipTo = new ApiContracts.CustomerAddressType();
        shipTo.setFirstName(shipping_firstname);
        shipTo.setLastName(shipping_lastname);
        shipTo.setAddress(shipping_address);
        shipTo.setCity(shipping_city);
        shipTo.setState(shipping_state);
        shipTo.setZip(shipping_zip);
        shipTo.setCountry('USA');

        // TRANSACTION INFO
        const transaction = new ApiContracts.TransactionRequestType();
        transaction.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
        transaction.setPayment(paymentType);
        transaction.setAmount(amount);
        transaction.setTax(tax);
        transaction.setOrder(orderDetails);
        transaction.setBillTo(billTo);
        transaction.setShipTo(shipTo);

        // TRANSACTION REQUEST
        const request = new ApiContracts.CreateTransactionRequest();
        request.setMerchantAuthentication(merchantAuthenticationType);
        request.setTransactionRequest(transaction);

        console.log(JSON.stringify(request.getJSON(), null, 2));

        // CONTROLLER
        const ctrl = new ApiControllers.CreateTransactionController(request.getJSON());
        // REMOVE THIS WHILE TESTING
        ctrl.setEnvironment(SDKConstants.endpoint.production);

        ctrl.execute(function() {
            const apiResp = ctrl.getResponse();
            const response = new ApiContracts.CreateTransactionResponse(apiResp);

            console.log(JSON.stringify(response, null, 2));

            if (response != null) {
                if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                    // Creating the order
                    let orderItems = [];

                    // Order items
                    for (var i = 0; i < items.length; i++) {
                        const item = items[i];
                        const listing = item.listing;
                        const option = item.option;
                        const size = item.size;

                        const newOrderItem = new OrderItem({
                            listing : listing._id,
                            option : option._id,
                            price : option.price,
                            size : size
                        });

                        orderItems.push(newOrderItem);
                    }

                    // Order
                    const newOrder = new Order({
                        owner : req.user._id,
                        transaction : response.getTransactionResponse().getTransId().toString(),
                        shipping_firstname : shipping_firstname,
                        shipping_lastname : shipping_lastname,
                        shipping_address : shipping_address,
                        shipping_city : shipping_city,
                        shipping_state : shipping_state,
                        shipping_zip : shipping_zip,
                        contact_firstname : contact_firstname,
                        contact_lastname : contact_lastname,
                        contact_email : contact_email,
                        contact_phone : contact_phone,
                        bill_address : bill_address,
                        bill_city : bill_city,
                        bill_state : bill_state,
                        bill_zip : bill_zip,
                        items : orderItems
                    });

                    req.user.cart = [];

                    newOrder
                    .save()
                    .then(req.user.save()
                    .then(() => {

                        req.flash('success', 'Thank you for shopping with us! You will receive an email with more information shortly. Transaction ID: #' + response.getTransactionResponse().getTransId());
                        res.redirect('/');

                        mailer.sendEmail(
                            contact_email,
                            'Order Confirmation #' + response.getTransactionResponse().getTransId().toString(),
                            'receipt',
                            context = {
                                id : req.user._id,
                                order : newOrder
                            });
                    }));

                } else {
                    console.log('TRANSACTION FAILED');

                    if (
                        response.getTransactionResponse() != null &&
                        response.getTransactionResponse().getErrors() != null &&
                        response.getTransactionResponse().getErrors()[0] != null) {
                            
                        console.log('CODE: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                        console.log('MESSAGE: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                        req.flash('error', 'Transaction failed. Reason: ' + response.getTransactionResponse().getErrors()[0].getErrorCode());
                    } else {
                        console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                        console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                        req.flash('error', 'Transaction failed. If you believe this is an issue on our end contact us immediately.')
                    }

                    res.redirect('/cart/checkout');
                }
            } else {
                console.log('TRANSACTION FAILED - EMPTY RESPONSE');
            }

            console.log('TRANSACTION COMPLETE');
        });
    });
});

// CHARGE REQ
router.post('/checkout/charge/:code', (req, res) => {
    if (!attemptCartAccess(req, res)) {
        return;
    }

    const { 
        shipping_firstname, shipping_lastname, shipping_address, shipping_city, shipping_state, shipping_zip,
        contact_firstname, contact_lastname, contact_email, contact_phone,
        card_number, expmo, expyr, csv, bill_address, bill_city, bill_state, bill_zip 
    } = req.body;

    const code = req.params.code;

    let errors = [];
    let error = '';

    if (!shipping_firstname.match(/[a-z]/i)) {
        errors.push('First name for Shipping Address must only contain characters A-Z');
    }

    if (!shipping_lastname.match(/[a-z]/i)) {
        errors.push('Last name for Shipping Address must only contain characters A-Z');
    }

    if (shipping_firstname.length > 32) {
        errors.push('First name for Shipping Address must be less than 32 characters long');
    }

    if (shipping_lastname.length > 32) {
        errors.push('Last name for Shipping Address must be less than 32 characters long');
    }

    if (!shipping_city.match(/[a-z]/i)) {
        errors.push('City for Shipping Address must only contain characters A-Z');
    }

    if (isNaN(shipping_zip)) {
        errors.push('Zip code for Shipping Address must be a number');
    }

    if (!contact_firstname.match(/[a-z]/i)) {
        errors.push('First name for Contact Information must only contain characters A-Z');
    }

    if (!contact_lastname.match(/[a-z]/i)) {
        errors.push('Last name for Contact Information must only contain characters A-Z');
    }

    if (contact_firstname.length > 32) {
        errors.push('First name for Contact Information must be less than 32 characters long');
    }

    if (contact_lastname.length > 32) {
        errors.push('Last name for Contact Information must be less than 32 characters long');
    }

    if (!contact_email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
        errors.push('Email must be a valid format');
    }

    if (contact_phone && !contact_phone.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im)) {
        errors.push('Phone number for Contact Information must be a valid format');
    }

    if (isNaN(card_number)) {
        errors.push('Invalid credit card number');
    }

    if (isNaN(expmo)) {
        errors.push('Invalid expire month');
    }

    if (isNaN(expyr)) {
        errors.push('Invalid expire year');
    }

    if (isNaN(csv)) {
        errors.push('Invalid CSV');
    }

    if (errors.length > 0) {
        error = errors.join('\n');

        req.flash('error', error);
        res.redirect('/cart/checkout');

        return;
    }

    PromoCode.findOne({ code : code }, (err, promoCode) => {
        if (err) {
            throw err;
        }

        if (!promoCode) {
            req.flash('error', 'Invalid discount code');
            res.redirect('/cart/checkout');
            return;
        }

        getCart(req, (results) => {
            let amount = 0;
            const items = [];
    
            for (var i = 0; i < results.length; i++) {
                const result = results[i];
                let context;
    
                if (result.size && result.size !== null) {
                    context = {
                        listing : result.listing,
                        option : result.option,
                        size : result.size
                    };
                } else {
                    context = {
                        listing : result.listing,
                        option : result.option
                    };
                }
    
                amount += result.option.price;
    
                items.push(context);
            }

            // PERCENT DISCOUNT
            if (promoCode.percentDiscounted > 0) {
                amount = amount - (amount * promoCode.percentDiscounted);
            }

            // DOLLAR DISCOUNT
            if (promoCode.dollarDiscounted > 0) {
                amount = amount - promoCode.dollarDiscounted;
            }
    
            // MERCHANT LOGIN
            const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
            merchantAuthenticationType.setName(authorize.apiLoginKey);
            merchantAuthenticationType.setTransactionKey(authorize.transactionKey);
    
            // CREDIT CARD
            const card = new ApiContracts.CreditCardType();
            card.setCardNumber(card_number);
            card.setExpirationDate(expmo + expyr);
            card.setCardCode(csv);
    
            // SET PAYMENT TYPE TO CREDIT CARD
            const paymentType = new ApiContracts.PaymentType();
            paymentType.setCreditCard(card);
    
            // ORDER DETAILS
            const orderDetails = new ApiContracts.OrderType();
            orderDetails.setDescription('Purchase @ The Fine Jewelry Bar');
    
            // TAXES
            const tax = new ApiContracts.ExtendedAmountType();
    
            if (shipping_state === 'CA') {
                tax.setAmount(Math.round(amount * 0.0775));
                tax.setName('California Sales Tax');
            } else {
                tax.setAmount(0);
            }
    
            // BILLING TO
            const billTo = new ApiContracts.CustomerAddressType();
            billTo.setFirstName(contact_firstname);
            billTo.setLastName(contact_lastname);
            billTo.setAddress(bill_address);
            billTo.setCity(bill_city);
            billTo.setState(bill_state);
            billTo.setZip(bill_zip);
    
            // SHIPPING TO
            const shipTo = new ApiContracts.CustomerAddressType();
            shipTo.setFirstName(shipping_firstname);
            shipTo.setLastName(shipping_lastname);
            shipTo.setAddress(shipping_address);
            shipTo.setCity(shipping_city);
            shipTo.setState(shipping_state);
            shipTo.setZip(shipping_zip);
            shipTo.setCountry('USA');
    
            // TRANSACTION INFO
            const transaction = new ApiContracts.TransactionRequestType();
            transaction.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
            transaction.setPayment(paymentType);
            transaction.setAmount(amount);
            transaction.setTax(tax);
            transaction.setOrder(orderDetails);
            transaction.setBillTo(billTo);
            transaction.setShipTo(shipTo);
    
            // TRANSACTION REQUEST
            const request = new ApiContracts.CreateTransactionRequest();
            request.setMerchantAuthentication(merchantAuthenticationType);
            request.setTransactionRequest(transaction);
    
            console.log(JSON.stringify(request.getJSON(), null, 2));
    
            // CONTROLLER
            const ctrl = new ApiControllers.CreateTransactionController(request.getJSON());
            // REMOVE THIS WHILE TESTING
            ctrl.setEnvironment(SDKConstants.endpoint.production);
    
            ctrl.execute(function() {
                const apiResp = ctrl.getResponse();
                const response = new ApiContracts.CreateTransactionResponse(apiResp);
    
                console.log(JSON.stringify(response, null, 2));
    
                if (response != null) {
                    if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                        // Creating the order
                        let orderItems = [];
    
                        // Order items
                        for (var i = 0; i < items.length; i++) {
                            const item = items[i];
                            const listing = item.listing;
                            const option = item.option;
                            const size = item.size;
    
                            const newOrderItem = new OrderItem({
                                listing : listing._id,
                                option : option._id,
                                price : option.price,
                                size : size
                            });
    
                            orderItems.push(newOrderItem);
                        }
    
                        // Order
                        const newOrder = new Order({
                            owner : req.user._id,
                            transaction : response.getTransactionResponse().getTransId().toString(),
                            shipping_firstname : shipping_firstname,
                            shipping_lastname : shipping_lastname,
                            shipping_address : shipping_address,
                            shipping_city : shipping_city,
                            shipping_state : shipping_state,
                            shipping_zip : shipping_zip,
                            contact_firstname : contact_firstname,
                            contact_lastname : contact_lastname,
                            contact_email : contact_email,
                            contact_phone : contact_phone,
                            bill_address : bill_address,
                            bill_city : bill_city,
                            bill_state : bill_state,
                            bill_zip : bill_zip,
                            items : orderItems
                        });
    
                        req.user.cart = [];
    
                        newOrder
                        .save()
                        .then(req.user.save()
                        .then(() => {
    
                            req.flash('success', 'Thank you for shopping with us! You will receive an email with more information shortly. Transaction ID: #' + response.getTransactionResponse().getTransId());
                            res.redirect('/');
    
                            mailer.sendEmail(
                                contact_email,
                                'Order Confirmation #' + response.getTransactionResponse().getTransId().toString(),
                                'receipt',
                                context = {
                                    id : req.user._id,
                                    order : newOrder
                                });
                        }));
    
                    } else {
                        console.log('TRANSACTION FAILED');
    
                        if (
                            response.getTransactionResponse() != null &&
                            response.getTransactionResponse().getErrors() != null &&
                            response.getTransactionResponse().getErrors()[0] != null) {
                                
                            console.log('CODE: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                            console.log('MESSAGE: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                            req.flash('error', 'Transaction failed. Reason: ' + response.getTransactionResponse().getErrors()[0].getErrorCode());
                        } else {
                            console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                            console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                            req.flash('error', 'Transaction failed. If you believe this is an issue on our end contact us immediately.')
                        }
    
                        res.redirect('/cart/checkout');
                    }
                } else {
                    console.log('TRANSACTION FAILED - EMPTY RESPONSE');
                }
    
                console.log('TRANSACTION COMPLETE');
            });
        });
    });
});

module.exports = router;