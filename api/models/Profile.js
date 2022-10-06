/**
 * Profile.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    name: {
      type: 'string',
      allowNull: true
    },
    firstName: {
      type: 'string',
      allowNull: true
    },
    middleName: {
      type: 'string',
      allowNull: true
    },
    lastName: {
      type: 'string',
      allowNull: true
    },
    type: {
      type: 'string',
      isIn: ['admin', 'careTaker', 'driver', 'organization', 'branch', 'other'],
      required: true
    },
    profilePicURL: {
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
    token: {
      type: 'string',
      allowNull: true
    },
    deviceDetail: {
      type: 'json'
    },
    address: {
      type: 'json'
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    branch: {
      model: 'branch',
    },
    role: {
      model: 'role'
    },
    organization: {
      model: 'organization'
    },
  },
  customToJSON() {
    // obviously never return token downstream to anyone, ever
    return _.omit(this, [
      'token',
    ]);
  },
  beforeCreate: function (profile, cb) {
    // create full address from address object
    if (profile.address) {
      let fullAddress = '';
      if (profile.address.streetLine1) {
        fullAddress += fullAddress + profile.address.streetLine1;
        if (profile.address.streetLine2) { fullAddress += ',' + profile.address.streetLine2; }
        if (profile.address.city) { fullAddress += ',' + profile.address.city; }
        if (profile.address.state) { fullAddress += ',' + profile.address.state; }
        if (profile.address.country) { fullAddress += ',' + profile.address.country; }
        if (profile.address.pincode) { fullAddress += ',' + profile.address.pincode; }
      }
      if (fullAddress) {
        profile.address['fullAddress'] = fullAddress;
      }
    }
    // Combine firstName middleName and lastName in name
    if (profile.firstName) {
      profile.name = profile.firstName;
    }
    if (profile.middleName) {
      profile.name += ' ' + profile.middleName;
    }
    if (profile.lastName) {
      profile.name += ' ' + profile.lastName;
    }
    cb();
  },
  beforeUpdate(profile, cb) {
    // create full address from address object
    if (profile.address) {
      let fullAddress = '';
      if (profile.address.streetLine1) {
        fullAddress += fullAddress + profile.address.streetLine1;
        if (profile.address.streetLine2) { fullAddress += ',' + profile.address.streetLine2; }
        if (profile.address.city) { fullAddress += ',' + profile.address.city; }
        if (profile.address.state) { fullAddress += ',' + profile.address.state; }
        if (profile.address.country) { fullAddress += ',' + profile.address.country; }
        if (profile.address.pincode) { fullAddress += ',' + profile.address.pincode; }
      }
      if (fullAddress) {
        profile.address['fullAddress'] = fullAddress;
      }
    }
    // Combine firstName middleName and lastName in name
    if (profile.firstName || profile.middleName || profile.lastName) {
      Profile.findOne({ id: profile.id }).exec((err, oldData) => {
        if (err) { return cb(err); }
        if (profile.firstName || oldData.firstName) {
          profile.name = profile.firstName || oldData.firstName;
        }
        if (profile.middleName || oldData.middleName) {
          profile.name += ' ' + (profile.middleName || oldData.middleName);
        }
        if (profile.lastName || oldData.lastName) {
          profile.name += ' ' + (profile.lastName || oldData.lastName);
        }
        return cb();
      });
    } else {
      return cb();
    }
  }

};

