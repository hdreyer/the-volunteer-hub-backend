var express = require('express');
var router = express.Router();
var User = require('../models/Users');
const authService = require('../services/auth');
const Org = require('../models/Organizations');
var ObjectId = require('mongodb').ObjectId;



//ROUTE FOR A NEW USER TO SIGNUP.
router.post('/signup', (req, res, next) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: authService.hashPassword(req.body.password)
  });
  user.save()
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        res.send("User already exists.");
        console.log("User already exists.", err);
      } else {
        res.status(201).json({
          message: "You are a new user!",
          createdPost: user
        });
        res.render('login')
      }
    });
});

//ROUTE FOR A USER TO LOGIN.
router.post('/login', function (req, res, next) {
  User.findOne({
    'username': req.body.username
  })
    .then(user => {
      if (!user) {
        console.log("User not found.");
        return res.status(401).json({
          message: "Login failed."
        });
      } else {
        let passwordMatch = authService.comparePasswords(req.body.password, user.password);
        if (passwordMatch) {
          let token = authService.signUser(user);
          res.cookie('jwt', token);
          console.log(user, token);
          return res.status(201).json({
            message: "You are logged in.",
            token: token
          });
        } else {
          console.log("Wrong password!");
          return res.status(401).json({
            message: "Login failed."
          });
        }

      }
    })
});

//ROUTE FOR A USER TO LOGOUT.
router.get('/logout', function (req, res, send) {
  res.cookie('jwt', "", {
    expires: new Date(0)
  });
  res.send('You are logged out');
});

//ROUTE TO RETRIEVE THE CURRENTLY LOGGED IN USER'S INFO FOR THEIR PROFILE PAGE
router.get('/Userprofile', function (req, res, next) {
  let token = req.cookies.token;
  console.log(token);
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user) {
          User.findOne({ 'username': user.username }).then(user => {
            console.log(user);
            res.send(user);
          }).catch(err => {
            console.log(err);
          });
        }
      })
  } else {
    res.send('must be logged in');
    console.log("You must be logged in.");
  }
});

//ROUTE TO GET ORGANIZATION FOR PROFILE PAGE
router.get('/userOrgs', function (req, res, next) {
  let token = req.cookies.token;
  if (token) {
    authService.verifyUser(token).then(user => {
      if (user) {
        Org.find({ 'username': user.username }).then(org => {
          console.log(org);
          res.send(org);
        }).catch(err => {
          console.log(err);
        })
      }
    })
  } else {
    res.send('must be logged in');
  }
})

//ROUTE FOR A REGISTERED USER TO CREATE AN ORGANIZATION
router.post('/createOrg', function (req, res, next) {
  let token = req.cookies.token;
  console.log(token);
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user) {
          const org = new Org({
            username: user.username,
            name: req.body.name,
            city: req.body.city,
            state: req.body.state,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            description: req.body.description
          });
          org.save()
            .then(result => {
              console.log(result);
            })
            .catch(err => {
              if (err) {
                console.log(err);
              } else {
                res.status(201).json({
                  message: "Your organization has been posted.",
                  createdOrg: org
                });
              }
            });
        }
      })
  } else {
    res.send("You must be logged in.");
    console.log("You must be logged in.");
  }
});

//ROUTE FOR A USER TO EDIT THEIR ORGANIZATION INFO
router.patch('/updateOrg/:orgId', function (req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user) {
          Org.findById(req.params.orgId, (err) => {
            if (err) {
              console.log(err);
            } else {
              Org.updateOne({ '_id': req.params.orgId }, req.body, { safe: true }, function (err, changed) {
                if (err) {
                  console.log(err);
                } else {
                  res.send(changed);
                  console.log(changed);
                }
              })
            }
          })
        }
      })
  } else {
    console.log('You must be logged in.');
    res.send('You must be logged in.');
    res.status(401);
  }
});


module.exports = router;