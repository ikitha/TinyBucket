var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require("method-override"),
    app = express(),
    models = require('./models/index'),
    // ejs-locals, for layouts
    engine = require('ejs-locals'),
    session = require('cookie-session'),
    flash = require('connect-flash');

//passport and session requires
var passport = require("passport"),
    localStrategy = require("passport-local").Strategy;

app.set("view engine", "ejs");

// this is different from setting the view engine
// it enables the layout functionality
app.engine('ejs', engine);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(methodOverride("_method"));

app.use(express.static(__dirname + '/public'));
//enable the session
//session needs a key
//with which to encode the session values
//exposed to us by require('cookie-session')
app.use(session({
  keys:['key']
}));
//enable the flash messages api
//exposed to us by require('connect-flash')
app.use(flash());

//session middleware- set up passport for use
app.use(session( {
  secret: 'thisismysecretkey',
  name: 'Tiny Cookie',
  maxage: 3600000
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    models.User.find({
        where: {
            id: id
        }
    }).done(function(error,user){
        done(error, user);
    });
});


//GET ROUTES
app.get("/", function(req, res) {
    res.redirect("/login");
});

app.get("/login", function(req, res) {
    res.render('login.ejs');
});

app.get("/new", function(req, res) {
    res.render('signup.ejs');
});

app.get("/home", function(req, res) {
    if (req.isAuthenticated()) {
        res.render('home.ejs', {
        isAuthenticated: req.isAuthenticated(),
        currentUser: req.user.id
    });
        models.Task.getRandomTask(currentUser);
    } else {
        res.redirect("/new");
    }
});

app.get("/about", function(req, res) {
    res.render('about.ejs');
});

app.get("/discover", function(req, res) {
    res.render('discover.ejs');
});

app.get("/account/settings", function(req, res) {
    if (req.isAuthenticated()) {
        res.render('settings.ejs');
    } else {
        res.redirect("/new");
    }
});

app.get("/account/feed", function(req, res) {
    if (req.isAuthenticated()) {
        res.render('feed.ejs');
    } else {
        res.redirect("/new");
    }
});

app.get("/contact", function(req, res) {
    res.render('contact.ejs');
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/login");
});

app.get("/newtask", function(req, res) {
    res.render("createtask.ejs");
});

//POST ROUTES
app.post("/new", function(req, res) {
  models.User.createNewUser({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    privacy: 1
  }, function() {
    res.redirect("/signup");
  }, function() {
    res.redirect("/login");
  });
});

app.post("/newtask", function(req, res) {
  models.Task.createNewTask({
    task: req.body.title
  }, function() {
    console.log("something went wrong");
  }, function() {
    console.log("created new task");
  });
});

//post route for login handled through passport
app.post("/login", passport.authenticate("local", {
  successRedirect: "/home",
  failureRedirect: "/login"
}));

//post for blog entry
// app.post("/home", function(req, res) {
//     models.UsersTasks.create({

//     })
// })

app.listen(3000);