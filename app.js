/**
 * Module dependencies.
 */
var debug = require('debug')('skixdrop:server');

var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoStore = require('express-session-mongo');

var socketIOSession = require('socket.io.session');

var passport = require('passport');
var SpotifyStrategy = require('passport-spotify').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var routes = require('./routes/index');
var roomRoute = require('./routes/room');

var config = require('konphyg')('./config').all();

var _ = require('underscore');

var app = express();

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 *  passport serialize and deserialize
 */

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

var sessionStore = new mongoStore({db: 'skixdrop-sessions'});

var sessionSettings = {
    store: sessionStore,
    secret: config.session.secret,
    cookie: { path: '/', httpOnly: true, secure: false, maxAge: null},
    resave: false,  saveUninitialized: false, name: config.session.name
};

app.use(session(sessionSettings));

app.use(passport.initialize());
app.use(passport.session());
app.use('/', routes);
app.use('/room', ensureAuthenticated, roomRoute);

passport.use(new SpotifyStrategy({
        clientID:  config.spotify.clientID,
        clientSecret: config.spotify.clientSecret,
        callbackURL:  config.spotify.callbackURL
    },
    function (accessToken, refreshToken, profile, done) {
        //console.log('got user', profile);
        return done(null, profile);
    }
));

passport.use(new FacebookStrategy({
        clientID:  config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL:  config.facebook.callbackURL,
        profileFields: ['name', 'photos']
    },
    function(accessToken, refreshToken, profile, done) {
        //User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return done(null, profile);
        //});
    }
));

app.get('/auth/spotify',
    function(req,res,next) {
      if(req.isAuthenticated()) {
          return res.redirect('/room');
      }
        next();
    },
    passport.authenticate('spotify'),
    function (req, res) {
        // The request will be redirected to spotify for authentication, so this
        // function will not be called.
    });

app.get('/auth/spotify/callback',
    passport.authenticate('spotify', {failureRedirect: '/#auth-failure'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/room');
    });

app.get('/auth/facebook',
    function(req,res,next) {
        if(req.isAuthenticated()) {
            return res.redirect('/room');
        }
        next();
    },
    passport.authenticate('facebook'),
    function (req, res) {
        // The request will be redirected to facebook for authentication, so this
        // function will not be called.
    });

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {failureRedirect: '/#auth-failure'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/room');
    });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// test authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/#no-active-session')
}

/**
 * Create HTTP server.
 */

var server = require('http').Server(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 *  Stuff for socket.io
 */

var io = require('socket.io')(server);

var socketSession = socketIOSession(sessionSettings);

io.use(socketSession.parser);


var chat = io.of('/chat').on('connection', function(socket){

    socket.emit('welcome', {users:  getUsers(chat)});
	socket.broadcast.emit('message', {message: 'hat den Raum betreten!', user: getUserDataFromSessions(socket.session.passport.user)});

    socket.on('getChatUser', function(){
        chat.emit('userInChat', {users:  getUsers(chat)});
    });

    socket.on('send-message', function(data){
	if(data.message.trim() == '') return;

    chat.emit('message', {message: data.message, user:  getUserDataFromSessions(socket.session.passport.user)});
    });
});

chat.use(socketSession.parser);

function getUsers(chat) {
    var usersInChat = [];
    for(var key in chat.connected){
        var client = chat.connected[key];
        console.log('client', client);
        usersInChat.push(getUserDataFromSessions(client.session.passport.user));

    }
    return _.unique(usersInChat);
}


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server 'error' event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server 'listening' event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

function getUserDataFromSessions(userSession){
    var user;
    if(userSession.provider === 'spotify'){
        user =  {name: userSession.displayName.split(' ',1)[0], image: userSession.photos[0]}
    } else if(userSession.provider === 'facebook') {
        user = {name: userSession.name.givenName, image: userSession.photos[0].value}
    }
    return user;
}
