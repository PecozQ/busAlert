/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var Emailaddresses = require('machinepack-emailaddresses');

async function register(profileData, userData, req, res, driverProfile) {
  try {
    let profile;
    if (profileData.id) {
      profile = driverProfile;
    } else {
      profile = await Profile.create(profileData).fetch();
    }
    let careTaker;
    let passenger;
    if (req.body.type === 'careTaker') {
      caretakerData = {
        relationship: req.body.relationship || 'parent',
        profile: profile.id,
        notifyTime: req.body.notifyTime || 5
      };
      passenger = await Passenger.find({
        phoneNumber: userData.phoneNumber,
        countryCode: userData.countryCode
      });
      const passengerIds = _.pluck(passenger, 'id');
      caretakerData['passengers'] = passengerIds;
      careTaker = await Caretaker.create(caretakerData).fetch();
      const updateData = {
        notifyTime: 5,
        caretaker: careTaker.id,
        extraData: {
          isNotifyTimeUpdated: false
        }
      };
      await Passenger.getDatastore().sendNativeQuery(`
         UPDATE passenger
           SET "extraData" = "extraData"::jsonb - 'notificationDetails' || '{"notificationDetails":{}}'
         where "phoneNumber" = '${userData.phoneNumber}' and "countryCode" = '${userData.countryCode}'
         and "extraData"->'notificationDetails' is null;
         UPDATE passenger
           SET "extraData" = jsonb_set("extraData"::jsonb, '{notificationDetails,${careTaker.id}}','${JSON.stringify(updateData)}', true)
         where "phoneNumber" = '${userData.phoneNumber}' and "countryCode" = '${userData.countryCode}';`);
    }
    userData.profile = profile.id;
    User.create(userData).fetch().exec(async (err, user) => {
      if (err) {
        await Profile.destroy({ id: profile.id });
        if (req.body.type === 'careTaker') {
          await Caretaker.destroy({ id: careTaker.id });
          await Passenger.getDatastore().sendNativeQuery(`
             UPDATE passenger
               SET "extraData" = "extraData"::jsonb #- '{notificationDetails,${careTaker.id}}'
             where "phoneNumber" = '${userData.phoneNumber}' and "countryCode" = '${userData.countryCode}';`);
        }
        return res.badRequest(err);
      }
      //TODO: Maybe send confirmation email to the user before login
      // after creating a user record, log them in at the same time by issuing their first jwt token and setting a cookie
      var token = jwt.sign({ profile: profile.id }, sails.config.custom.jwtSecretKey, { expiresIn: '1d' });
      var profileSave = await Profile.updateOne({ id: profile.id }).set({ token });
      res.cookie('sailsjwt', token, {
        signed: true,
        // domain: '.yourdomain.com', // always use this in production to whitelist your domain
        maxAge: 24 * 60 * 60 * 1000
      });

      // if this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
      // send a 200 response letting the user agent know the signup was successful.
      user.profile = profileSave;
      if (req.wantsJSON) {
        return res.ok({ token, user, careTaker });
      }

      // otherwise if this is an HTML-wanting browser, redirect to /welcome.
      return res.redirect('/welcome');
    });
  } catch (err) {
    return res.serverError(err);
  }
}
async function login(user, res) {
  var careTaker;
  // if no errors were thrown, then grant them a new token
  // set these config vars in config/local.js, or preferably in config/env/production.js as an environment variable
  var token = jwt.sign({ profile: user.profile.id }, sails.config.custom.jwtSecretKey, { expiresIn: '1d' });
  var ProfileUpdate = await Profile.updateOne({ id: user.profile.id }).set({ token });
  if (!ProfileUpdate) {
    return res.serverError({ error: 'User token not updated' });
  }

  // set a cookie on the client side that they can't modify unless they sign out (just for web apps)
  res.cookie('sailsjwt', token, {
    signed: true,
    // domain: '.yourdomain.com', // always use this in production to whitelist your domain
    maxAge: 24 * 60 * 60 * 1000
  });
  if (user.profile) {
    delete user.profile;
    user.profile = ProfileUpdate;
  }
  if (user.profile.type === 'careTaker') {
    careTaker = await Caretaker.findOne({ profile: user.profile.id });
  }
  // provide the token to the client in case they want to store it locally to use in the header (eg mobile/desktop apps)
  return res.ok({ token, user, caretaker: careTaker });
}

module.exports = {
  // patch /api/users/login
  login: async function (req, res) {
    if (req.body.googleId) {
      userData.googleId = req.body.googleId;
      let user = await User.findOne({ googleId: req.body.googleId }).populate('profile');
      if (req.body.type && user && user.profile && user.profile.type !== req.body.type) {
        res.status(404);
        return res.send({ error: 'Type not match' });
      }
      if (user) {
        login(user, res);
      } else {
        register(profileData, userData, req, res);
      }
    } else if (req.body.facebookId) {
      userData.facebookId = req.body.facebookId;
      let user = await User.findOne({
        facebookId: req.body.facebookId
      }).populate('profile');
      if (req.body.type && user && user.profile && user.profile.type !== req.body.type) {
        res.status(404);
        return res.send({ error: 'Type not match' });
      }
      if (user) {
        login(user, res);
      } else {
        register(profileData, userData, req, res);
      }
    } else if (!req.body.email && req.body.phoneNumber) {
      if (req.body.phoneNumber.length > 10 || req.body.phoneNumber.length < 10) {
        return res.badRequest({ error: 'Invalid Phone Number.' });
      }
      let user = await User.findOne({
        phoneNumber: req.body.phoneNumber
      }).populate('profile');
      if (req.body.type && user && user.profile && user.profile.type !== req.body.type) {
        res.status(404);
        return res.send({ error: 'Type not match' });
      }
      if (user) {
        login(user, res);
      } else {
        register(profileData, userData, req, res);
      }
    } else {
      let user = await User.findOne({
        email: req.body.email
      }).populate('profile');
      console.log('the user is given as:', user);
      if (!user) {
        res.status(404);
        return res.send({ error: 'User not found' });
      }
      let fetchProfile = await Profile.findOne({ id: user.profile.id });
      if (!fetchProfile) {
        res.status(404);
        return res.send({ error: 'User profile not found' });
      }

      await bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (err) { return res.badRequest(err); }
        if (result) {
          login(user, res);
        } else {
          res.status(404);
          return res.send({ error: 'Invalid password' });
        }
      });
    }
  },

  // patch /api/users/logout
  logout: function (req, res) {
    res.clearCookie('sailsjwt');
    req.profile = null;
    return res.ok();
  },

  // post /api/users/register
  register: async function (req, res) {
    let profileData = {
      ...req.body,
      type: req.body.type || 'admin'
    };
    let userData = req.body;
    if (req.body.name) {
      profileData.name = req.body.name;
    }
    if (req.body.email) {
      userData.email = req.body.email;
    }
    if (req.body.phoneNumber) {
      userData.phoneNumber = req.body.phoneNumber;
      profileData.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.googleId) {
      userData.googleId = req.body.googleId;
      let user = await User.findOne({
        googleId: req.body.googleId
      }).populate('profile');
      if (req.body.type && user && user.profile && user.profile.type !== req.body.type) {
        res.status(404);
        return res.send({ error: 'Type not match' });
      }
      if (user) {
        login(user, res);
      } else {
        register(profileData, userData, req, res);
      }
    } else if (req.body.facebookId) {
      userData.facebookId = req.body.facebookId;
      let user = await User.findOne({
        facebookId: req.body.facebookId
      }).populate('profile');
      if (req.body.type && user && user.profile && user.profile.type !== req.body.type) {
        res.status(404);
        return res.send({ error: 'Type not match' });
      }
      if (user) {
        login(user, res);
      } else {
        register(profileData, userData, req, res);
      }
    } else if (!req.body.email && req.body.phoneNumber) {
      if (req.body.phoneNumber.length > 10 || req.body.phoneNumber.length < 10) {
        return res.badRequest({ error: 'Invalid Phone Number.' });
      }
      let user = await User.findOne({
        phoneNumber: req.body.phoneNumber
      }).populate('profile');
      if (req.body.type && user && user.profile && user.profile.type !== req.body.type) {
        res.status(404);
        return res.send({ error: 'Type not match' });
      }
      if (user) {
        login(user, res);
      } else {
        let profile;
        if (req.body.type === 'driver') {
          profile = await Profile.findOne({
            phoneNumber: req.body.phoneNumber
          });
          if (profile) {
            profileData.id = profile.id;
          }
        }
        register(profileData, userData, req, res, profile);
      }
    } else {
      if (_.isUndefined(req.body.email)) {
        return res.badRequest({ error: 'An Email address is required.' });
      }

      if (_.isUndefined(req.body.password)) {
        return res.badRequest({ error: 'A password is required.' });
      }

      if (_.isUndefined(req.body.type)) {
        return res.badRequest({ error: 'A user type is required.' });
      }

      if (req.body.password && req.body.password.length < 8) {
        return res.badRequest({ error: 'Password must be at least 8 characters.' });
      }

      emailValidate = await Emailaddresses.validate({
        string: req.body.email,
      }).exec({
        error: function (err) {
          return res.serverError(err);
        },
        invalid: function () {
          return res.badRequest({ error: 'Doesn\'t look like an email address.' });
        },
        success: async function () {
          userData = {
            email: req.body.email,
            password: req.body.password,
          };
          User.findOne({
            email: req.body.email
          }).populate('profile').exec((err, user) => {
            if (err) { return res.serverError(err); }
            if (user) {
              return res.badRequest({ error: 'Email address already available.' });
            }
            register(profileData, userData, req, res);
          });
        }
      });
    }
  },
  /**
    * get new token when the old token expired
    */
  refreshToken: async function (req, res) {
    let authorization = req.headers.Authorization;
    if (!authorization) {
      authorization = req.headers.authorization;
    }
    if (authorization) {
      var Oldtoken = authorization.split('Bearer ')[1];
      var findProfile = await Profile.findOne({ token: Oldtoken });
      if (!findProfile) {
        res.status(401);
        return res.send({ error: 'Please verify the token or Login again to verfiy' });
      }
      var token = jwt.sign({ profile: findProfile.id }, sails.config.custom.jwtSecretKey, { expiresIn: '1d' });
      await Profile.updateOne({ id: findProfile.id }).set({ token });
      return res.send({ token });
    } else {
      return res.badRequest({ error: 'Please send the auth token' });
    }
  },
  /**
    *
    * @param {*} req
    * @param {*} res
    * Check phone available in database for driver and caretaker
    */
  checkNumber: async function (req, res) {
    if (req.body && req.body.phoneNumber) {
      if (req.body.type === 'driver') {
        var profile = await Profile.findOne({
          phoneNumber: req.body.phoneNumber,
          countryCode: req.body.countryCode || '+91',
          type: 'driver'
        });
        if (!profile) {
          return res.badRequest({ error: 'Driver not found' });
        }
        return res.send(profile);
      } else if (req.body.type === 'careTaker') {
        var passenger = await Passenger.find({
          phoneNumber: req.body.phoneNumber,
          countryCode: req.body.countryCode || '+91'
        });
        if (!passenger || !passenger.length) {
          return res.badRequest({ error: 'CareTaker not found' });
        }
        return res.send(passenger[0]);
      } else {
        res.badRequest({ error: 'User type not found' });
      }
    } else {
      res.badRequest({ error: 'phoneNumber not found' });
    }
  }
};
