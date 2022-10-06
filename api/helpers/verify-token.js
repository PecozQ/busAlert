var jwt = require('jsonwebtoken');

module.exports = {
  friendlyName: 'Verify token',
  description: 'Verify a JWT token.',
  inputs: {
    req: {
      type: 'ref',
      friendlyName: 'Request',
      description: 'A reference to the request object (req).',
      required: true
    },
    res: {
      type: 'ref',
      friendlyName: 'Response',
      description: 'A reference to the response object (res).',
      required: true
    }
  },
  exits: {
    invalid: {
      description: 'Invalid token or no authentication present.',
    }
  },
  fn: function (inputs, exits) {
    var req = inputs.req;
    var res = inputs.res;
    // first check for a cookie (web client)
    if (req.signedCookies.sailsjwt && !req.header('Authorization')) {
      // if there is something, attempt to parse it as a JWT token
      return jwt.verify(req.signedCookies.sailsjwt, sails.config.custom.jwtSecretKey, async (err, payload) => {
        // if there's an error verifying the token (e.g. it's invalid or expired), no go
        if (err || !payload.user) { return exits.invalid(); }
        // otherwise try to look up that user
        var user = await User.findOne(payload.user);
        // if the user can't be found, no go
        if (!user) { return exits.invalid(); }
        // otherwise save the user object on the request (i.e. "log in") and continue
        req.user = user;
        return exits.success(user);
      });
    }
    // no? then check for a JWT token in the header
    if (req.header('Authorization')) {
      // if one exists, attempt to get the header data
      var token = req.header('Authorization').split('Bearer ')[1];
      // if there's nothing after "Bearer", no go
      if (!token) { return exits.invalid(); }
      // if there is something, attempt to parse it as a JWT token
      return jwt.verify(token, sails.config.custom.jwtSecretKey, async (err, payload) => {
        if (err && err.name === 'TokenExpiredError') {
          res.status(401);
          return res.send(err);
        }

        if (payload.type && payload.type === 'driver') {
          if (!payload.profile) { return exits.invalid(); }
          var Driverprofile = await Profile.findOne({
            id: payload.profile
          });
          if (!Driverprofile) { return exits.invalid(); }
          return exits.success(Driverprofile);
        } else {
          if (err || !payload.user) { return exits.invalid(); }
          var user = await Profile.findOne({ id: payload.user });
          if (!user) { return exits.invalid(); }
          req.user = user;
          return exits.success(user);
        }
      });
    }
    // if neither a cookie nor auth header are present, then there was no attempt to authenticate
    return exits.invalid();
  }
};
