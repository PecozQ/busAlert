/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
const bcrypt = require('bcryptjs');
module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    email: {
      type: 'string',
      isEmail: true,
      allowNull: true
    },

    password: {
      type: 'string',
      allowNull: true
    },
    countryCode: {
      type: 'string',
      defaultsTo: '+91'
    },
    phoneNumber: {
      type: 'string',
      allowNull: true
    },
    googleId: {
      type: 'string',
      allowNull: true
    },
    facebookId: {
      type: 'string',
      allowNull: true
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    profile: {
      model: 'profile'
    },
  },
  customToJSON: function () {
    return _.omit(this, ['password']);
  },
  beforeCreate: function (user, cb) {
    if (!user.password) { return cb(); }
    bcrypt.genSalt(10, (err, salt) => {
      if (err) { return cb(err); }
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) { return cb(err); }
        user.password = hash;
        return cb();
      });
    });
  },
  beforeUpdate(user, cb) {
    if (!user.password) { return cb(); }
    if (/^\$2[aby]\$[0-9]{2}\$.{53}$/.test(user.password)) { return cb(); }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) { return cb(err); }
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) { return cb(err); }
        user.password = hash;
        return cb();
      });
    });
  },

};

