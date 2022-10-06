'use strict';

/**
 * passport
 * @description :: Policy that inject user in `req` via JSON Web Token
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const bcrypt = require('bcryptjs');

// Serialize the user
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});
// Deserialize the user
passport.deserializeUser((id, cb) => {
  User.findOne({ id }, (err, users) => {
    cb(err, users);
  });
});
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (email, password, cb) => {
  User.findOne({ email: email }, (err, user) => {
    if (err) { return cb(err); }
    if (!user) { return cb(null, false, { message: 'Username not found' }); }
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) { return cb(err); }
      if (!res) { return cb(null, false, { message: 'Invalid Password' }); }
      let userDetails = {
        email: user.email,
        username: user.username,
        id: user.id
      };
      return cb(null, userDetails, { message: 'Login Succesful' });
    });
  });
}));
passport.use(new GoogleStrategy({
  clientID: '704934498147-oihltj0dcbtp2rordlrvqavnbh4uaaku.apps.googleusercontent.com',
  clientSecret: 'x_uMViGljDT_Th76iYCrjy5t',
  callbackURL: 'http://localhost:1337/auth/google/callback'
}, (token, tokenSecret, profile, cb) => {
  let model = {
    username: profile.username || profile.displayName || '',
    email: (profile.emails && profile.emails[0] && profile.emails[0].value) || '',
    firstName: (profile.name && profile.name.givenName) || '',
    lastName: (profile.name && profile.name.familyName) || '',
    photo: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
    googleId: profile.id
  };
  User.findOrCreate({ googleId: profile.id }, model, (err, user) => {
    if (err) { return cb(err); }
    if (!user) { return cb(null, false, { message: 'Username not found' }); }
    let userDetails = {
      email: user.email,
      username: user.username,
      id: user.id
    };
    return cb(null, userDetails, { message: 'Login Succesful' });
  });
}));
