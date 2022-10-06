/**
 * checkForUser
 *
 * @module      :: Policy
 * @description :: Simple policy to load an authenticated user, if any.  If we're not logged in, just continue.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // if (req.signedCookies.sailsjwt && !req.header('Authorization')) {
  //   // if there is something, attempt to parse it as a JWT token
  //   return jwt.verify(req.signedCookies.sailsjwt, sails.config.custom.jwtSecretKey, async (err, payload) => {
  //     // if there's an error verifying the token (e.g. it's invalid or expired), no go
  //     if (err || !payload.profile) {
  //       res.status(401);
  //       return res.send({ error: 'Invalid Token' });
  //     }
  //     // otherwise try to look up that user
  //     var profile = await Profile.findOne(payload.profile);
  //     // if the user can't be found, no go
  //     if (!profile) {
  //       res.status(401);
  //       return res.send({ error: 'Invalid Token' });
  //     }
  //     // otherwise save the user object on the request (i.e. "log in") and continue
  //     req.profile = profile;
  //     return next('', profile);
  //   });
  // }
  // no? then check for a JWT token in the header
  if (req.header('Authorization')) {
    // if one exists, attempt to get the header data
    var token = req.header('Authorization').split('Bearer ')[1];
    // if there's nothing after "Bearer", no go
    if (!token) {
      res.status(401);
      return res.send({ error: 'Invalid Token' });
    }
    // if there is something, attempt to parse it as a JWT token
    return jwt.verify(token, sails.config.custom.jwtSecretKey, async (err, payload) => {
      if (err && err.name === 'TokenExpiredError') {
        if (req.url === '/api/v1/refreshToken') {
          return next('');
        } else {
          res.status(401);
          return res.send(err);
        }
      }
      if (err) {
        res.status(401);
        return res.send(err);
      }
      if (err || !payload.profile) {
        res.status(401);
        return res.send({ error: 'Invalid Token' });
      }
      var profile = await Profile.findOne({ id: payload.profile });
      if (!profile) {
        res.status(401);
        return res.send({ error: 'Invalid Token' });
      }
      // if (!profile.role) {
      //   res.status(406);
      //   return res.send({ error: 'Role not found' });
      // }
      // req.profile = profile;
      // let parseBlueprintOptions = req.options.parseBlueprintOptions || req._sails.config.blueprints.parseBlueprintOptions;
      // let queryOptions = parseBlueprintOptions(req);
      // let role = await Role.findOne({ id: profile.role }).populate('permission');
      // if (req._sails.models[queryOptions.using] && req.method === 'GET') {
      //   let permissionIndex = _.findIndex(role.permission, {name: 'view_' + queryOptions.using});
      //   if (permissionIndex === -1) {
      //     permissionIndex = _.findIndex(role.permission, {name: 'edit_' + queryOptions.using});
      //   }
      //   if (permissionIndex === -1) {
      //     res.status(406);
      //     return res.send({ error: 'Invalid Role' });
      //   }
      // } else if (req._sails.models[queryOptions.using] && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE')) {
      //   let permissionIndex = _.findIndex(role.permission, {name: 'edit_' + queryOptions.using});
      //   if (permissionIndex === -1) {
      //     res.status(406);
      //     return res.send({ error: 'Invalid Role' });
      //   }
      // }
      req.profile = profile;
      return next('', profile);
    });
  } else {
    res.status(401);
    return res.send({ error: 'Invalid Token' });
  }
};
