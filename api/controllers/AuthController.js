/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const passport = require('passport');

module.exports = {
  login: async function (req, res) {
    await passport.authenticate('local', (err, user, info) => {
      if ((err) || (!user)) {
        return res.send({
          message: info.message,
          user
        });
      }
      req.logIn(user, (err) => {
        if (err) { res.send(err); }
        sails.log('User ' + user.id + ' has logged in.');
        return res.redirect('/dashboard');
      });
    })(req, res);
  },
  logout: function (req, res) {
    req.logout();
    res.redirect('/');
  },
  //Register function
  register: function (req, res) {
    //TODO: form validation here
    profileData = {
      name: req.body.name,
      type: req.body.type || 'admin'
    };
    userData = {
      email: req.body.email,
      password: req.body.password,
    };
    Profile.create(profileData).fetch().exec((err, profile) => {
      if (err) { return res.badRequest(err); }
      userData.profile = profile.id;
      User.create(userData).fetch().exec(async (err, user) => {
        if (err) {
          await Profile.destroy({ id: profile.id });
          return res.badRequest(err);
        }
        //TODO: Maybe send confirmation email to the user before login
        req.login(user, (err) => {
          if (err) { return res.badRequest(err); }
          sails.log('User ' + user.id + ' has logged in.');
          return res.redirect('/dashboard');
        });
      });
    });
  },
  social: function (req, res) {
    passport.authenticate('google', (err, user) => {
      if ((err) || (!user)) {
        return res.send({
          message: err.message,
          user
        });
      }
      req.logIn(user, (err) => {
        if (err) { res.send(err); }
        sails.log('User ' + user.id + ' has logged in.');
        return res.redirect('/dashboard');
      });
    })(req, res);
  },
  google: function (req, res) {
    passport.authenticate('google', { scope: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/plus.login'] })(req, res);
  }
};
