const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('express-flash');
const exphbs = require('express-handlebars');
const expfu = require('express-fileupload');
const compression = require('compression');

const app = express();

// Connect to database
mongoose.connect('mongodb://localhost/website', {
  useNewUrlParser : true,
  useUnifiedTopology : true
}).then(() => {
  console.log('Connected to the database');
  mongoose.set('debug', true);
});

// Express configuration
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ helpers : require('./public/javascripts/helpers') }));
app.set('view engine', 'handlebars');
app.use(compression());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret : 'secret', cookie : { maxAge: 86400000 }, resave : true, saveUninitialized : true }));

app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

app.use(flash());

app.use(expfu());

// Routes
app.use('/', require('./routes/index'));
app.use('/about', require('./routes/about'));
app.use('/lookbook', require('./routes/lookbook'));
app.use('/designers', require('./routes/designers'));
app.use('/users', require('./routes/users'));
app.use('/store', require('./routes/store'));
app.use('/admin', require('./routes/admin'));
app.use('/newsletter', require('./routes/newsletter'));
app.use('/events', require('./routes/events'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));
app.use('/legal', require('./routes/legal'));
app.use('/blog', require('./routes/blog'));

mongoose.connect('mongodb://localhost/website');

// Error handling
app.use((req, res, next) => {
  next(createError(404));
})

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error', { code : err.code, stack : err.stack });
});

module.exports = app;