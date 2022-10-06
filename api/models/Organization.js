/**
 * Organization.js
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
    type: {
      type: 'string',
      isIn: ['school', 'govt', 'private', 'other'],
      defaultsTo: 'other',
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    admin: {
      model: 'profile',
    },
    users: {
      collection: 'profile',
      via: 'organization'
    }
  },
  beforeCreate: function (organization, cb) {
    if (!organization.address) { return cb(); }
    let fullAddress = '';
    if (organization.address.streetLine1) {
      fullAddress += fullAddress + organization.address.streetLine1;
      if (organization.address.streetLine2) { fullAddress += ',' + organization.address.streetLine2; }
      if (organization.address.city) { fullAddress += ',' + organization.address.city; }
      if (organization.address.state) { fullAddress += ',' + organization.address.state; }
      if (organization.address.country) { fullAddress += ',' + organization.address.country; }
      if (organization.address.pincode) { fullAddress += ',' + organization.address.pincode; }
    }
    if (fullAddress) {
      organization.address['fullAddress'] = fullAddress;
    }
    cb();
  },
  beforeUpdate(organization, cb) {
    if (!organization.address) { return cb(); }
    let fullAddress = '';
    if (organization.address.streetLine1) {
      fullAddress += fullAddress + organization.address.streetLine1;
      if (organization.address.streetLine2) { fullAddress += ',' + organization.address.streetLine2; }
      if (organization.address.city) { fullAddress += ',' + organization.address.city; }
      if (organization.address.state) { fullAddress += ',' + organization.address.state; }
      if (organization.address.country) { fullAddress += ',' + organization.address.country; }
      if (organization.address.pincode) { fullAddress += ',' + organization.address.pincode; }
    }
    if (fullAddress) {
      organization.address['fullAddress'] = fullAddress;
    }
    cb();
  }

};

