const express = require('express');
const router = express.Router();
const utils = require('../public/javascripts/utils');

const Listing = require('../models/listing');
const Designer = require('../models/designer');

function getNextPageQuery(query) {
    const split = query.split('&');
    const result = [];

    if (split.length == 0) {
        return 'page=2'
    }

    for (var i = 0; i < split.length; i++) {
        const str = split[i];

        if (!str.includes('page=')) {
            result.push(str);
            continue;
        }

        const page = str.replace('page=', '');

        if (isNaN(page)) {
            console.log("received NaN page number");
            result.push(str);
            continue;
        }

        const number = Number(page);

        result.push('page=' + (number + 1));
    }

    return result.join('&');
}

function getPrevPageQuery(query) {
    const split = query.split('&');
    const result = [];

    if (split.length == 0) {
        return '';
    }

    for (var i = 0; i < split.length; i++) {
        const str = split[i];

        if (!str.includes('page=')) {
            result.push(str);
            continue;
        }

        const page = str.replace('page=', '');

        if (isNaN(page)) {
            console.log("received NaN page number");
            result.push(str);
            continue;
        }

        const number = Number(page);

        result.push('page=' + (number - 1));
    }

    return result.join('&');
}

function getValues(args) {
    let designers = [];
    let categories = [];
    let materials = [];
    let prices = [];
    let min, max;
    let sort;
    let page;
    let nextPageUrl, prevPageUrl;

    for (var i = 0; i < args.length; i++) {
        const str = args[i];

        if (str.includes('designer=')) {
            designers.push(str.replace('designer=', ''));
        }

        if (str.includes('category=')) {
            categories.push(str.replace('category=', ''));
        }

        if (str.includes('material=')) {
            materials.push(str.replace('material=', ''));
        }

        if (str.includes('min=')) {
            const n = str.replace('min=', '');

            if (!isNaN(n)) {
                min = Number(n);
            }
        }

        if (str.includes('max=')) {
            const n = str.replace('max=', '');

            if (!isNaN(n)) {
                max = Number(n);
            }
        }

        if (str.includes('page=')) {
            const n = str.replace('page=', '');

            if (!isNaN(n)) {
                page = Number(n);
            }
        }

        if (str.includes('sort=')) {
            const s = str.replace('sort=', '');

            if (
                s != 'lowest' &&
                s != 'highest' &&
                s != 'designer') {

                continue;

            }

            sort = str.replace('sort=', '');
        }

        if (str.includes('price=')) {
            const priceRanges = new Map();
            const price = str.replace('price=', '');

            if (price == '500') {
                priceRanges.set(0, 500);
            }

            if (price == '500-1000') {
                priceRanges.set(500, 1000);
            }

            if (price == '1000-2500') {
                priceRanges.set(1000, 2500);
            }

            if (price == '2500-5000') {
                priceRanges.set(2500, 5000);
            }

            if (price == '5000') {
                priceRanges.set(5000, 50000);
            }

            const mins = Array.from(priceRanges.keys());
            const maxes = Array.from(priceRanges.values());

            prices.push(str.replace('price=', ''));

            mins.sort((a, b) => a - b);
            maxes.sort((a, b) => b - a);

            if (mins.length > 0) {
                min = mins[0];
            }

            if (maxes.length > 0) {
                max = maxes[0];
            }
        }
    }

    const values = {
        designers : designers,
        categories : categories,
        materials : materials,
        prices : prices,
        min : min,
        max : max,
        sort : sort,
        page : page,
        nextPageUrl : nextPageUrl,
        prevPageUrl : prevPageUrl
    }

    return values;
}

function sortListings(listings, sort) {
    if (sort == 'lowest' || sort == 'highest') {
        listings.sort((a, b) => {
            const pricesA = [];
            const pricesB = [];
            let valA, valB;

            for (var i = 0; i < a.options.length; i++) {
                pricesA.push(a.options[i].price);
            }

            for (var i = 0; i < b.options.length; i++) {
                pricesB.push(b.options[i].price);
            }

            if (sort == 'lowest') {
                valA = Math.min(...pricesA);
                valB = Math.min(...pricesB)

                return valA - valB;
            } else {
                valA = Math.max(...pricesA);
                valB = Math.max(...pricesB);

                return valB - valA;
            }
        });
    } else {
        listings.sort((a, b) => a.designer.localeCompare(b.designer));
    }

    return listings;
}

router.get('/', (req, res) => {
    const nextPageUrl = '/store/page=2';
    const currentPageUrl = '/store/';

    let search = Listing.aggregate();

    search.append({ $limit : 24 });
    search.append({ $sort : { designer : 1 }});

    search.exec((err, listings) => {
        if (err) {
            throw err;
        }

        Designer.find({}, (err, designers) => {
            if (err) {
                throw err;
            }

            designers.sort((a, b) => a.name.localeCompare(b.name));

            res.render('store', { title : 'Store', listings : utils.getListingContext(listings), designers : utils.getDesignerContext(designers), currentPageUrl : currentPageUrl, nextPageUrl : nextPageUrl, user : utils.getLimitedUserContext(req.user) });
        });
    });
});

router.get('/category/:category', (req, res) => {
    const category = req.params.category;
    const fancyName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const currentPageUrl = '/store/category/' + category + '/';
    const nextPageUrl = '/store/category/' + category + '/page=2';
    const search = Listing.aggregate();

    if (

        category != 'ring' &&
        category != 'bracelet' &&
        category != 'earring' &&
        category != 'pendant' &&
        category != 'necklace') {

        req.flash('error', 'Invalid category');
        res.redirect('/store');
        return;

    }

    search.append({ $match : { type : category }});
    search.append({ $sort : { designer : 1, name : 1 }});
    search.append({ $limit : 24 });

    search.exec((err, listings) => {
        if (err) {
            throw err;
        }

        Designer.find({}, (err, designers) => {
            if (err) {
                throw err;
            }

            designers.sort((a, b) => a.name.localeCompare(b.name));

            res.render('store', {
                title : 'Store',
                listings : utils.getListingContext(listings),
                designers : utils.getDesignerContext(designers),
                category : fancyName,
                currentPageUrl : currentPageUrl,
                nextPageUrl : nextPageUrl,
                user : utils.getLimitedUserContext(req.user)
            });
        });
    });
});

router.get('/category/:category/:query', (req, res) => {
    const args = req.params.query.split('&');
    const category = req.params.category;
    const fancyName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const search = Listing.aggregate();
    const values = getValues(args);
    const designers = values.designers;
    const materials = values.materials;
    const prices = values.prices;
    const min = values.min;
    const max = values.max;
    const sort = values.sort;
    const page = values.page;
    const currentPageUrl = '/store/category/' + category + '/' + req.params.query;
    let nextPageUrl, prevPageUrl;

    search.append({ $match : { type : category }});

    if (sort) {
        if (sort == 'lowest') {
            search.append({ $sort : { 'options.price' : 1 }});
        }
        
        else if (sort == 'highest') {
            search.append({ $sort : { 'options.price' : -1 }});
        }

        else if (sort == 'designer') {
            search.append({ $sort : { designer : 1, name : 1 }});
        }
    } else {
        search.append({ $sort : { designer : 1, name : 1 }});
    }

    if (page) {
        const correctedPage = (page - 1);
        const skipped = correctedPage * 24;

        if (correctedPage >= 1) {
            search.append({ $skip : skipped });
        }

        nextPageUrl = '/store/category/' + category + '/' + getNextPageQuery(req.params.query);
        prevPageUrl = '/store/category/' + category + '/' + getPrevPageQuery(req.params.query);
    } else {
        nextPageUrl = '/store/category/' + category + '/' + req.params.query + '&page=2';
    }

    if (designers.length > 0) {
        search.append({ $match : { designer : { $in : designers }}});
    }

    if (materials.length > 0) {
        search.append({ $match : { 'options.identifier' : { $in : materials }}});
    }

    if (min) {
        search.append({ $match : { 'options.price' : { $gte : min }}});
    }

    if (max) {
        search.append({ $match : { 'options.price' : { $lte : max }}});
    }

    search.append({ $limit : 24 });

    search.exec((err, listings) => {
        if (err) {
            throw err;
        }

        Designer.find({}, (err, designersPool) => {
            if (err) {
                throw err;
            }

            const selected = {
                designers : designers,
                materials : materials,
                prices : prices,
                sort : sort
            }

            res.render('store', {
                title : 'Store',
                listings : utils.getListingContext(listings),
                designers : utils.getDesignerContext(designersPool),
                category : fancyName,
                currentPageUrl : currentPageUrl,
                nextPageUrl : nextPageUrl,
                user : utils.getLimitedUserContext(req.user),
                selected : selected
            });
        });
    });
});

router.get('/designer/:designer', (req, res) => {
    const designer = req.params.designer;
    const currentPageUrl = '/store/designer/' + designer + '/';
    const nextPageUrl = '/store/designer/' + designer + '/page=2';
    const search = Listing.aggregate();

    search.append({ $match : { designer : designer }});
    search.append({ $limit : 24 });
    search.append({ $sort : { designer : 1 }});

    search.exec((err, listings) => {
        if (err) {
            throw err;
        }

        Designer.find({}, (err, designers) => {
            if (err) {
                throw err;
            }

            designers.sort((a, b) => a.name.localeCompare(b.name));

            res.render('store', {
                title : 'Store',
                listings : utils.getListingContext(listings),
                designers : utils.getDesignerContext(designers),
                designer : designer,
                currentPageUrl : currentPageUrl,
                nextPageUrl : nextPageUrl,
                user : utils.getLimitedUserContext(req.user)
            });
        });
    });
});

router.get('/designer/:designer/:query', (req, res) => {
    const args = req.params.query.split('&');
    const designer = req.params.designer;
    const search = Listing.aggregate();
    const values = getValues(args);
    const categories = values.categories;
    const materials = values.materials;
    const prices = values.prices;
    const min = values.min;
    const max = values.max;
    const sort = values.sort;
    const page = values.page;
    const currentPageUrl = '/store/designer/' + designer + '/' + req.params.query;
    let nextPageUrl, prevPageUrl;

    search.append({ $match : { designer : designer }});

    if (page) {
        const correctedPage = (page - 1);
        const skipped = correctedPage * 24;

        if (correctedPage >= 1) {
            search.append({ $skip : skipped });
        }

        nextPageUrl = '/store/designer/' + designer + '/' + getNextPageQuery(req.params.query);
        prevPageUrl = '/store/designer/' + designer + '/' + getPrevPageQuery(req.params.query);
    } else {
        nextPageUrl = '/store/designer/' + designer + '/' + req.params.query + '&page=2';
    }

    if (categories.length > 0) {
        search.append({ $match : { type : { $in : categories }}});
    }

    if (materials.length > 0) {
        search.append({ $match : { 'options.identifier' : { $in : materials }}});
    }

    if (min) {
        search.append({ $match : { 'options.price' : { $gte : min }}});
    }

    if (max) {
        search.append({ $match : { 'options.price' : { $lte : max }}});
    }

    search.append({ $limit : 24 });

    if (sort) {
        if (sort == 'lowest') {
            search.append({ $sort : { 'options.price' : 1 }});
        }
        
        else if (sort == 'highest') {
            search.append({ $sort : { 'options.price' : -1 }});
        }

        else if (sort == 'designer') {
            search.append({ $sort : { designer : 1 }});
        }
    } else {
        search.append({ $sort : { designer : 1 }});
    }

    search.exec((err, listings) => {
        if (err) {
            throw err;
        }

        Designer.find({}, (err, designersPool) => {
            if (err) {
                throw err;
            }

            const selected = {
                categories : categories,
                materials : materials,
                prices : prices,
                sort : sort
            }

            res.render('store', {
                title : 'Store',
                listings : utils.getListingContext(listings),
                designers : utils.getDesignerContext(designersPool),
                designer : designer,
                currentPageUrl : currentPageUrl,
                nextPageUrl : nextPageUrl,
                prevPageUrl : prevPageUrl,
                user : utils.getLimitedUserContext(req.user),
                selected : selected
            });
        });
    });
});

router.get('/listing/:id', function(req, res) {
    Listing.findOne({ _id : req.params.id }, function(err, listing) {
        if (err) {
            throw err;
        }

        if (!listing) {
            req.flash('error', 'Listing not found');
            res.redirect('/store');
            return;
        }

        var options = listing.options;
        let query = {};

        options.sort((a, b) => a.identifier.localeCompare(b.identifier));

        if (listing.coll) {
            query = { designer : listing.designer, coll : listing.coll };
        } else {
            query = { designer : listing.designer };
        }

        Listing
        .find(query)
        .limit(3)
        .exec(function(err, similarListings) {
            if (err) {
                throw err;
            }

            res.render('listing', { 
                title : listing.name,
                listing : utils.getSingleListingContext(listing),
                listingId : listing._id.toString(),
                option : utils.getSingleOptionContext(options[0]),
                options : utils.getOptionContext(options),
                price : options[0].price,
                similarListings : utils.getListingContext(similarListings),
                user : utils.getLimitedUserContext(req.user)
            });
        });
    });
});

router.get('/listing/:id/:option', function(req, res, next) {
    Listing.findOne({ _id : req.params.id }, function(err, listing) {
        if (err) {
            throw err;
        }

        var options = listing.options;
        let option;
        let query;

        options.sort((a, b) => a.identifier.localeCompare(b.identifier));

        for (var i = 0; i < options.length; i++) {
            const o = options[i];

            if (o._id == req.params.option) {
                option = o;
                break;
            }
        }

        if (!option) {
            req.flash('error', 'Option is not found for this listing');
            res.redirect('/store/listing/');
            return;
        }

        if (listing.coll) {
            query = { designer : listing.designer, coll : listing.coll };
        } else {
            query = { designer : listing.designer };
        }

        Listing
        .find(query)
        .limit(3)
        .exec(function(err, similarListings) {
            if (err) {
                throw err;
            }

            res.render('listing', {
                title : listing.name,
                listing : utils.getSingleListingContext(listing),
                option : utils.getSingleOptionContext(option),
                options : utils.getOptionContext(options),
                price : option.price,
                similarListings : utils.getListingContext(similarListings),
                user : utils.getLimitedUserContext(req.user)
            });
        });
    });
});

router.get('/:query', (req, res) => {
    const args = req.params.query.split('&');
    const search = Listing.aggregate();
    const values = getValues(args);
    const designers = values.designers;
    const categories = values.categories;
    const materials = values.materials;
    const prices = values.prices;
    const min = values.min;
    const max = values.max;
    const sort = values.sort;
    const page = values.page;
    const currentPageUrl = '/store/' + req.params.query;
    let nextPageUrl, prevPageUrl;

    if (categories && categories.length > 0) {
        search.append({ $match : { type : { $in : categories }}});
    }

    if (designers && designers.length > 0) {
        search.append({ $match : { designer : { $in : designers }}});
    }

    if (materials && materials.length > 0) {
        search.append({ $match : { 'options.identifier' : { $in : materials }}});
    }

    if (min) {
        search.append({ $match : { 'options.price' : { $gte : min }}});
    }

    if (max) {
        search.append({ $match : { 'options.price' : { $lte : max }}});
    }

    if (sort) {
        if (sort == 'lowest') {
            search.append({ $sort : { 'options.price' : 1 }});
        }
        
        else if (sort == 'highest') {
            search.append({ $sort : { 'options.price' : -1 }});
        }

        else if (sort == 'designer') {
            search.append({ $sort : { designer : 1, name : 1 }});
        }
    } else {
        search.append({ $sort : { designer : 1, name : 1 }});
    }

    if (page) {
        const correctedPage = (page - 1);
        const skipped = correctedPage * 24;

        if (correctedPage >= 1) {
            search.append({ $skip : skipped });
        }

        nextPageUrl = '/store/' + getNextPageQuery(req.params.query);
        prevPageUrl = '/store/' + getPrevPageQuery(req.params.query);
    } else {
        nextPageUrl = '/store/' + req.params.query + '&page=2';
    }

    search.append({ $limit : 24 });

    search.exec((err, listings) => {
        if (err) {
            throw err;
        }

        Designer.find({}, (err, designersPool) => {
            if (err) {
                throw err;
            }

            const selected = {
                designers : designers,
                categories : categories,
                materials : materials,
                prices : prices,
                sort : sort
            }

            res.render('store', {
                title : 'Store',
                listings : utils.getListingContext(listings),
                designers : utils.getDesignerContext(designersPool),
                currentPageUrl : currentPageUrl,
                nextPageUrl : nextPageUrl,
                prevPageUrl : prevPageUrl,
                user : utils.getLimitedUserContext(req.user),
                selected : selected
            });
        });
    });
});

module.exports = router;