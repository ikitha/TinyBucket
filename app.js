var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require("method-override"),
    app = express(),
    models = require('./models/index'),
    // ejs-locals, for layouts
    engine = require('ejs-locals'),
    session = require('cookie-session'),
    flash = require('connect-flash'),
    Sequelize = require('sequelize');

//passport and session requires
var passport = require("passport"),
    localStrategy = require("passport-local").Strategy;

var mailer   = require("mailer")
  , mandrillUserName = process.env.MANDRILL_USERNAME
  , mandrillPassword = process.env.MANDRILL_APIKEY;

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
    res.render('login.ejs', {
      isAuthenticated: req.isAuthenticated(),
      messages: req.flash('error')//pass in flash error through passport
    });
});

app.get("/new", function(req, res) {
    res.render('signup.ejs', {
      isAuthenticated: req.isAuthenticated(),
      messages: req.flash('info')//pass in error from signup form
    });
});

app.get("/home", function(req, res) {
  var currentUser = req.user.id;
    if (req.isAuthenticated()) {
      models.User.find(currentUser).then(function(user) {//find current user if authenticated
          user.getCurrentTask().then(function(task) {//get their current_task_id
              res.render('home.ejs', {//render homepage and pass in task to plug into view
                  isAuthenticated: req.isAuthenticated(),
                  currentUser: currentUser,
                  task: task
              });
          });
      });
    } else {
      res.redirect("/new");
    }
});

app.get("/about", function(req, res) {
  var currentUser = req.user;
    res.render('about.ejs', {
        isAuthenticated: req.isAuthenticated()
    });
});

app.get("/discover", function(req, res) {
  models.Task.findAll().then(function(allTasks) {//find all the tasks for the dropdown menu
    res.render('discover.ejs', {
        isAuthenticated: req.isAuthenticated(),
        allTasks: allTasks
    });
  });
});

app.get("/account/settings", function(req, res) {
  var currentUser = req.user;
    if (req.isAuthenticated()) {//only allow authenticated user to get to settings page
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
      models.UsersTasks.findAll({//find all the current user's tasks and include the task model to access task title
        where: {
          'UserId' :currentUser
        }, 
        include: [ 
          {
            model: models.Task,
            required: true
          } 
        ],
        order: [['updatedAt', 'DESC']]  
      }).then(function(currentUserTasks) {//if promise is fufilled, send their tasks to their feed view
        res.render('feed.ejs', {
          currentUserTasks: currentUserTasks,
          isAuthenticated: req.isAuthenticated()
        });
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
  req.logout();//logout
  res.redirect("/login");
});

app.get("/newtask", function(req, res) {
    res.render("createtask.ejs");//this page is just for me right now!
});

app.get("/404", function(req, res) {
  res.render('404.ejs');//this page is just for me right now!!
});

//POST ROUTES
app.post("/new", function(req, res) {
  models.Task.getRandomTask()//get a random task
  .then(function(task) {
    //console.log("found task", task);
    return models.User.createNewUser({//create a new user
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      privacy: 1,
      current_task_id: task.id//assign the random task here
    })
  })
  .then(function() {//on success, redirect to login
    res.redirect("/login");
  })
  .catch(function(error) {//catch the error and pass the error message to re-render same page and try again
    res.render("signup.ejs", {
      isAuthenticated: req.isAuthenticated(),
      messages: error.errors
    });
  });
});

app.post("/account/feed", function(req, res) {
  var currentUser = req.user.id;
  return models.UsersTasks.createCompletedTask({//create a completed task, or "post"
    userid: currentUser,
    taskid: req.body.taskid,
    post: req.body.post
  }).then(function() {//then get a new random task that won't repeat tasks they have done before
    return models.Task.getRandomTaskForUser(currentUser)
  })
  .then(function(task) {
    return models.User.find(currentUser)
    .then(function(user){//update the new task in the user table (current_task_id)
      user.updateAttributes({
      current_task_id: task.id
      }).then(function() {
        res.redirect("/account/feed");
      });
    });
  });
});

app.get("/discover/show", function(req, res) {
  //console.log("this is query", req.query.selectTask);
  return models.UsersTasks.findAll({//find all the tasks where the users are public and the task id is what is selected in the dropdown.
    where: Sequelize.and(
      {'TaskId': req.query.selectTask},
      {'User.privacy': 1}
    ), 
    include: [ 
      {
        model: models.Task,//include task table for task title
        required: true
      },
      {
        model: models.User,//include user table for privacy status
        required: true
      }  
    ],
    order: [['updatedAt', 'DESC']] //order by newest at top
  })
  .then(function(taskresults) {
    res.render('discover-id', {//pass in results to view
      taskresults: taskresults,
      isAuthenticated: req.isAuthenticated()
    });
  });
});

app.post("/newtask", function(req, res) {//this is just for me!!
  models.Task.createNewTask({
    task: req.body.title
  }, function() {
    //console.log("something went wrong");
  }, function() {
    //console.log("created new task");
  });
});

//post route for login handled through passport
app.post("/login", passport.authenticate('local', {//if successful go home, otherwise go back to login and pass along error
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: {
      type: 'error',
      message: "Your credentials were incorrect."
    }
  })
);

//put route to edit user info
app.put("/account/user/:id", function(req, res) {
  var currentUser = req.user.id;
  if (currentUser == req.params.id) {//verify user to allow editing user profile
    if (req.body.privacy) {//set privacy where 1 is public and 0 is private for click box
      var privacyOption = 0;
    } else {
      var privacyOption = 1;
    }
    models.User.find(currentUser)
    .then(function(user) {//then update user attributes
      user.updateAttributes({
        first_name: req.body.firstname,
        last_name: req.body.lastname,
        username: req.body.username,
        privacy: privacyOption
      })
      .then(function() {//on success, redirect to same page and show changes
        res.redirect("/account/settings");
      });
    });
  } else {//if malicious attempt at editing other user's profile, render 404 error
    res.render('404.ejs');
  }
});

app.post("/contact", function(req, res) {//handle contact page to send to my email
  mailer.send(
    { host:           "smtp.mandrillapp.com"
    , port:           587
    , to:             process.env.MY_EMAIL
    , from:           req.body.email
    , subject:        "Comments on TinyBucket"
    , body:           req.body.comment
    , authentication: "plain"
    , username:       mandrillUserName
    , password:       mandrillPassword
    }, function(err, result){
      if(err){
        console.log(err);
      } else {
        res.redirect('/discover');
      }
    }
  );
});

app.listen(process.env.PORT || 3000);