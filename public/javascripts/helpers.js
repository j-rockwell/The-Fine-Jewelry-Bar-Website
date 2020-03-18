module.exports = {
    grouped_each : function(every, context, options) {
        var out = "", subcontext = [], i;
        if (context && context.length > 0) {
            for (i = 0; i < context.length; i++) {
                if (i > 0 && i % every === 0) {
                    out += options.fn(subcontext);
                    subcontext = [];
                }

                subcontext.push(context[i]);
            }
            
            out += options.fn(subcontext);
        }

        return out;
    },

    price : function(options) {
        let prices = [];

        if (options) {
            for (var i = 0; i < options.length; i++) {
                const option = options[i];
                prices.push(option.price);
            }
        }

        const price = Math.min(... prices);

        return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,').toString();
    },

    formatPrice : function(arg) {
        return arg.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,').toString();
    },

    nextPage : function(arg) {
        if (isNaN(arg)) {
            return 'null';
        }

        var num = arg;
        num += 1;

        return num;
    },

    prevPage : function(arg) {
        if (isNaN(arg)) {
            return 'null';
        }

        var num = arg;
        num -= 1;

        return num;
    },

    // DEPRECATED, USE GT
    greaterThan : function(arg1, arg2, options) {
        'use strict';

        if (arg1 >= arg2) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },

    // DEPRECATED, USE LT
    lessThan : function(arg1, arg2, options) {
        'use strict';

        if (arg1 <= arg2) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },

    // DEPRECATED, USE EQ
    equals : function(arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },

    // DEPRECATED, USE NE
    notEquals : function(arg1, arg2, options) {
        return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    },

    iterateMap : function(map, block) {
        let output = '';

        for (const [ key, value ] of map) {
            output += block.fn({ key, value });
        }

        return output;
    },

    calcSubtotal : function(values) {
        let price = 0;

        for (var i = 0; i < values.length; i++) {
            const value = values[i];
            price += value.price;
        }

        return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,').toString();
    },

    calcTax : function(values) {
        let price = 0;

        for (var i = 0; i < values.length; i++) {
            const value = values[i];
            price += value.price;
        }

        price = price * 0.0775;

        return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,').toString();
    },

    calcTotal : function(values) {
        let price = 0, tax = 0, total = 0;

        for (var i = 0; i < values.length; i++) {
            const value = values[i];
            price += value.price;
        }

        tax = price * 0.0775;
        total = price + tax;

        return total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,').toString();
    },

    asString : function(listing) {
        return listing._id.toString();
    },

    eq: function (v1, v2) {
        return v1 === v2;
    },

    ne: function (v1, v2) {
        return v1 !== v2;
    },

    lt: function (v1, v2) {
        return v1 < v2;
    },

    gt: function (v1, v2) {
        return v1 > v2;
    },

    lte: function (v1, v2) {
        return v1 <= v2;
    },

    gte: function (v1, v2) {
        return v1 >= v2;
    },

    and: function () {
        return Array.prototype.slice.call(arguments).every(Boolean);
    },
    
    or: function () {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },

    cont : function (val, arr) {
        if (!val || !arr) {
            return false;
        }

        for (var i = 0; i < arr.length; i++) {
            const o = arr[i];

            if (o == val) {
                return true;
            }
        }

        return false;
    }
}