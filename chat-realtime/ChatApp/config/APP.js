/*
 * application init
*/

var express = require('express');
var app = express();
flash = require('connect-flash');
JASON = require("JASON");

Zchat = require('./izzi - libs/chat/chat.js');
ZchatUtils = new Zchat.utils();

// TODO. connect memcache.
var memcache = require("memcache");
memcache_client = new memcache.Client(11211, "localhost");
memcache_client.connect();

// TODO. Connecto to mongo DB
//mongoose = require('mongoose');
//mongoose.connect('mongodb://192.168.1.111/test'); 

// TODO. Authenticate
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
 
 
// helper functions
function findById(id, fn) {
  if(id){
	var user = {};
	user.id = id;
	fn(null,user);
  }else{
	fn("qapolo. user not found!");
  }
}
 
function findUserByPhpSessionID(PHPSESSID, fn) {
	memcache_client.get("sessions/" + PHPSESSID, function(error, result){
				if(typeof(error)==="undefined"){
					var session = JSON.parse(result);
					if(session){
						if(session.__ZF){
							if(session.__ZF.UserId){
								var user = {};
								user.id = session.__ZF.UserId;
								return fn(null,user);
							}
						}
					}
					return fn(null, null);
				}
	});		
  
}
 
 
// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});
 
 
// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a username and password), and invoke a callback
// with a user object. In the real world, this would query a database;
// however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
	{
		usernameField: 'PHPSESSID',
		//passwordField: 'password',
		isCookie: true
	},
    function(PHPSESSID, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findUserByPhpSessionID(PHPSESSID, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + PHPSESSID }); }
		return done(null, user);
      })
    });
  }
));
 
// export

module.exports = {
  
	// Name of the application (used as default <title>)
	appName: "Izzi App",
 
	// Port this Sails application will live on
	port: 1337,
 
	// The environment the app is deployed in 
	// (`development` or `production`)
	//
	// In `production` mode, all css and js are bundled up and minified
	// And your views and templates are cached in-memory.  Gzip is also used.
	// The downside?  Harder to debug, and the server takes longer to start.
	environment: 'development',
 
  // Custom express middleware - we use this to register the passport middleware
	express: {
		customMiddleware: function(app)
		{
			app.use(passport.initialize());
			app.use(passport.session());
		}
	}
 
};