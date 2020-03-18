const moment = require('../javascripts/moment');

const Listing = require('../../models/listing');

/**
 * Retreives a context variable containing a safe exposure of the users data
 * @param {*} req Request
 */
const getLimitedUserContext = function getLimitedUserContext(user) {
    let context;

    if (user) {
        context = {
            first_name : user.firstName,
            newsletter : user.newsletter,
            cart : user.cart,
            admin : user.admin,
            date_created : user.dateCreated
        }
    }

    return context;
}

/**
 * Retrieves a context variable containing unsafe exposure of the users data
 * 
 * This should be accessed as little as possible
 * 
 * @param {*} req Request
 */
const getFullUserContext = function getUserContext(user) {
    let context;

    if (user) {
        context = {
            _id : user._id,
            first_name : user.firstName,
            last_name : user.lastName,
            email : user.email,
            password : user.password,
            newsletter : user.newsletter,
            cart : user.cart,
            admin : user.admin,
            date_created : user.dateCreated
        };
    }

    return context;
}

const getUsersContext = function getUsersContext(users) {
    let context = [];

    if (users) {
        for (var i = 0; i < users.length; i++) {
            const user = users[i];

            const item = {
                _id : user._id,
                first_name : user.firstName,
                last_name : user.lastName,
                email : user.email,
                password : user.password,
                newsletter : user.newsletter,
                cart : user.cart,
                admin : user.admin,
                date_created : user.dateCreated
            }

            context.push(item);
        }
    }

    return context;
}

/**
 * Retrieves a context variable containing safe exposure of the designers data
 * @param {*} designers Designers
 */
const getDesignerContext = function getDesignerContext(designers) {
    let context = [];

    if (designers) {
        for (var i = 0; i < designers.length; i++) {
            const item = {
                _id : designers[i]._id,
                name : designers[i].name
            };
    
            context.push(item);
        }
    }

    return context;
}

/**
 * Retrieves a context variable containing safe exposure of the orders data
 * @param {*} orders Orders
 */
const getOrderContext = function getOrderContext(orders) {
    let context = [];

    if (orders) {
        for (var i = 0; i < orders.length; i++) {
            const order = orders[i];
    
            const item = {
                _id : order._id,
                owner : order.owner,
                transaction : order.transaction,
                status : order.status,
                shipping_tracking : order.shipping_tracking,
                shipping_firstname : order.shipping_firstname,
                shipping_lastname : order.shipping_lastname,
                shipping_address : order.shipping_firstname,
                shipping_city : order.shipping_city,
                shipping_state : order.shipping_state,
                shipping_zip : order.shipping_zip,
                contact_firstname : order.firstname,
                contact_lastname : order.contact_lastname,
                contact_email : order.contact_email,
                contact_phone : order.contact_phone,
                bill_address : order.bill_address,
                bill_city : order.bill_city,
                bill_zip : order.bill_zip,
                items : order.items,
                date : order.date
            };
    
            context.push(item);
        }
    }

    return context;
}

/**
 * Retrieves a context variable containing safe exposure of the listings data
 * @param {*} listings Listings
 */
const getListingContext = function getListingContext(listings) {
    let context = [];

    if (listings) {
        for (var i = 0; i < listings.length; i++) {
            const listing = listings[i];
    
            const item = {
                _id : listing._id,
                name : listing.name,
                description : listing.description,
                designer : listing.designer,
                type : listing.type,
                coll : listing.coll,
                options : getOptionContext(listing.options),
                featured : listing.featured,
                priority : listing.priority,
                date : listing.date
            };
    
            context.push(item);
        }
    }

    return context;
}

/**
 * Retrieves a context variable containing safe exposure of a single listing data
 * @param {*} listing 
 */
const getSingleListingContext = function getSingleListingContext(listing) {
    let item;

    if (listing) {
        item = {
            _id : listing._id,
            name : listing.name,
            description : listing.description,
            designer : listing.designer,
            type : listing.type,
            coll : listing.coll,
            options : getOptionContext(listing.options),
            featured : listing.featured,
            priority : listing.priority,
            date : listing.date
        };
    }

    return item;
}

/**
 * Retrieves a context variable containing safe exposure of the options data
 * @param {*} options 
 */
const getOptionContext = function getOptionContext(options) {
    let context = [];

    if (options) {
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
    
            const item = {
                _id : option._id,
                identifier : option.identifier,
                sku : option.sku,
                ordertype : option.ordertype,
                metal : option.metal,
                gemstone : option.gemstone,
                sizes : option.sizes,
                cost : option.cost,
                price : option.price,
                quantity : option.quantity
            };
    
            context.push(item);
        }
    }

    return context;
}

/**
 * Retrieves a context variable containing safe exposure of a single option data
 * @param {*} option 
 */
const getSingleOptionContext = function getSingleOptionContext(option) {
    let item;

    if (option) {
        item = {
            _id : option._id,
            identifier : option.identifier,
            sku : option.sku,
            ordertype : option.ordertype,
            metal : option.metal,
            gemstone : option.gemstone,
            sizes : option.sizes,
            cost : option.cost,
            price : option.price,
            quantity : option.quantity
        };
    }

    return item;
}

/**
 * Retrieves a context variable containing safe exposure of a single promo codes data
 * @param {*} code 
 */
const getSinglePromoCodeContext = function getSinglePromoCodeContext(code) {
    let item;

    if (code) {
        item = {
            _id : code._id,
            code : code.code,
            min_cart_value : code.minCartValue,
            percent_discounted : code.percentDiscounted,
            dollar_discounted : code.dollar_discounted,
            remaining_uses : code.remainingUses,
            created : code.created,
            expire : code.expire
        };
    }

    return item;
}

/**
 * Retrieves a context variable containing safe exposure of a promo code data
 * @param {*} codes
 */
const getPromoCodeContext = function getPromoCodeContext(codes) {
    let context = [];

    if (codes) {
        for (var i = 0; i < codes.length; i++) {
            const code = codes[i];

            item = {
                _id : code._id,
                code : code.code,
                min_cart_value : code.minCartValue,
                percent_discounted : code.percentDiscounted,
                dollar_discounted : code.dollarDiscounted,
                remaining_uses : code.remainingUses,
                created : code.created,
                expire : code.expire
            }

            context.push(item);
        }
    }

    return context;
}

/**
 * Retreives an option object from a listing
 * @param {*} id Options ID
 * @param {*} callback Callback
 */
const getOption = function getOption(id, callback) {
    Listing.findOne({ 'options._id' : id }, (err, listing) => {
        if (err) {
            throw err;
        }

        for (var i = 0; i < listing.options.length; i++) {
            const option = listing.options[i];

            if (option._id == id) {
                callback(option);
                return;
            }
        }

        callback(null);
        return;
    });
}

/**
 * Returns true or false of the passed request contains a user who is an administrator
 * @param {*} req Request
 * @param {*} res Response
 */
const isAdmin = function isAdmin(req, res) {
    if (!req.user || !req.user.admin) {
        req.flash('error', 'You do not have permission to view this page');
        res.redirect('/');
        return false;
    }
    
    return true;
}

/**
 * Returns true if the first provided date is past the second provided date
 * @param {*} dateA Date A (usually the current time)
 * @param {*} dateB Date B (the time to be checked after)
 */
const isExpired = function isExpired(dateA, dateB) {
    return moment(dateA).isAfter(dateB);
}

module.exports = {
    getUsersContext : getUsersContext,
    getLimitedUserContext : getLimitedUserContext,
    getFullUserContext : getFullUserContext,
    getDesignerContext : getDesignerContext,
    getOrderContext : getOrderContext,
    getListingContext : getListingContext,
    getSingleListingContext : getSingleListingContext,
    getOptionContext : getOptionContext,
    getSingleOptionContext : getSingleOptionContext,
    getSinglePromoCodeContext : getSinglePromoCodeContext,
    getPromoCodeContext : getPromoCodeContext,
    getOption : getOption,
    isAdmin : isAdmin,
    isExpired : isExpired
}