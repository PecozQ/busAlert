/**
 * Branch.js
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
      required: true
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
    organization: {
      model: 'organization',
    },
    admin: {
      model: 'profile',
    },
    users: {
      collection: 'profile',
      via: 'branch'
    },
    branch: {
      collection: 'vehicle',
      via: 'branch'
    }
  },
  beforeCreate: function (branch, cb) {
    if (!branch.address) { return cb(); }
    let fullAddress = '';
    if (branch.address.streetLine1) {
      fullAddress += fullAddress + branch.address.streetLine1;
      if (branch.address.streetLine2) { fullAddress += ',' + branch.address.streetLine2; }
      if (branch.address.city) { fullAddress += ',' + branch.address.city; }
      if (branch.address.state) { fullAddress += ',' + branch.address.state; }
      if (branch.address.country) { fullAddress += ',' + branch.address.country; }
      if (branch.address.pincode) { fullAddress += ',' + branch.address.pincode; }
    }
    if (fullAddress) {
      branch.address['fullAddress'] = fullAddress;
    }
    cb();
  },
  beforeUpdate(branch, cb) {
    if (!branch.address) { return cb(); }
    let fullAddress = '';
    if (branch.address.streetLine1) {
      fullAddress += fullAddress + branch.address.streetLine1;
      if (branch.address.streetLine2) { fullAddress += ',' + branch.address.streetLine2; }
      if (branch.address.city) { fullAddress += ',' + branch.address.city; }
      if (branch.address.state) { fullAddress += ',' + branch.address.state; }
      if (branch.address.country) { fullAddress += ',' + branch.address.country; }
      if (branch.address.pincode) { fullAddress += ',' + branch.address.pincode; }
    }
    if (fullAddress) {
      branch.address['fullAddress'] = fullAddress;
    }
    cb();
  }

};

