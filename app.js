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
    res.redirect("/login", {
      isAuthenticated: req.isAuthenticated()
    });
});

app.get("/login", function(req, res) {
    res.render('login.ejs', {
      isAuthenticated: req.isAuthenticated()
    });
});

app.get("/new", function(req, res) {
    res.render('signup.ejs', {
      isAuthenticated: req.isAuthenticated()
    });
});

app.get("/home", function(req, res) {
    var currentUser = req.user.id;
    if (req.isAuthenticated()) {
        models.User.find(currentUser).then(function(user) {
            user.getCurrentTask().then(function(task) {
                res.render('home.ejs', {
                    isAuthenticated: req.isAuthenticated(),
                    currentUser: currentUser,
                    task: task
                });
            });
        });

        // models.Task.getRandomTask(currentUser)
        //     .then(function(task) {
        //         res.render('home.ejs', {
        //             isAuthenticated: req.isAuthenticated(),
        //             currentUser: currentUser,
        //             task: task
        //         });
        //     });
    } else {
        res.redirect("/new");
    }
});

app.get("/about", function(req, res) {
    res.render('about.ejs', {
        isAuthenticated: req.isAuthenticated()
    });
});

app.get("/discover", function(req, res) {
  models.Task.findAll().then(function(allTasks) {
    res.render('discover.ejs', {
        isAuthenticated: req.isAuthenticated(),
        allTasks: allTasks
    });
  });
});

app.get("/account/settings", function(req, res) {
  var currentUser = req.user;
    if (req.isAuthenticated()) {
        res.render('settings.ejs', {
          isAuthenticated: req.isAuthenticated(),
          currentUser: currentUser
        });
    } else {
        res.redirect("/new", {
          isAuthenticated: req.isAuthenticated()
        });
    }
});

app.get("/account/feed", function(req, res) {
  var currentUser = req.user.id;
    if (req.isAuthenticated()) {
      models.UsersTasks.findAll({
        where: {
          'UserId' :currentUser
        }, 
        include: [ 
          {
            model: models.Task,
            required: true
          } 
        ] 
      }).then(function(currentUserTasks) {
        res.render('feed.ejs', {
          currentUserTasks: currentUserTasks,
          isAuthenticated: req.isAuthenticated()
        });
        console.log(currentUserTasks);
      });
    } else {
        res.redirect("/new");
    }
});

app.get("/contact", function(req, res) {
    res.render('contact.ejs', {
      isAuthenticated: req.isAuthenticated()
    });
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
  models.Task.getRandomTask()
  .then(function(task) {
    console.log("found task", task);
    return models.User.createNewUser({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      privacy: 1,
      current_task_id: task.id
    })
  })
  .then(function() {
    res.redirect("/login");
  })
  .catch(function() {
    res.redirect("/signup");
  });
});

app.post("/account/feed", function(req, res) {
  var currentUser = req.user.id;
  return models.UsersTasks.createCompletedTask({
    userid: currentUser,
    taskid: req.body.taskid,
    post: req.body.post
  }).then(function() {
    return models.Task.getRandomTaskForUser(currentUser)
  })
  .then(function(task) {
    return models.User.find(currentUser)
    .then(function(user){
      user.updateAttributes({
      current_task_id: task.id
      }).then(function() {
        res.redirect("/account/feed");
      });
    });
  });
});

app.get("/discover/show", function(req, res) {
  console.log("this is query", req.query.selectTask);
  return models.UsersTasks.findAll({
    where: {
      'TaskId': req.query.selectTask
    }, 
    include: [ 
      {
        model: models.Task,
        required: true
      } 
    ] 
  })
  .then(function(taskresults) {
    res.render('discover-id', {
      taskresults: taskresults,
      isAuthenticated: req.isAuthenticated()
    });
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

//put route to edit user info
app.put("/account/user/:id", function(req, res) {
  var currentUser = req.user.id;
  if (currentUser == req.params.id) {
    if (req.body.privacy) {
      var privacyOption = 0;
    } else {
      var privacyOption = 1;
    }
    models.User.find(currentUser)
    .then(function(user) {
      user.updateAttributes({
        first_name: req.body.firstname,
        last_name: req.body.lastname,
        username: req.body.username,
        privacy: privacyOption
      })
      .then(function() {
        res.redirect("/account/settings");
      });
    });
  } else {
    //404
  }
});






app.listen(process.env.PORT || 3000);