/**
 * Stopping.js
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
    type: {
      type: 'string',
      isIn: ['stop', 'via'],
      defaultsTo: 'via'
    },
    address: {
      type: 'json',
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
    route: {
      collection: 'route',
      via: 'stopping',
      through: 'routestopping'
    },
  },
  beforeCreate: function (stopping, cb) {
    if (!stopping.address) { return cb(); }

    // create full address from address object
    let fullAddress = '';
    if (stopping.address.streetLine1) {
      fullAddress += fullAddress + stopping.address.streetLine1;
      if (stopping.address.streetLine2) { fullAddress += ',' + stopping.address.streetLine2; }
      if (stopping.address.city) { fullAddress += ',' + stopping.address.city; }
      if (stopping.address.state) { fullAddress += ',' + stopping.address.state; }
      if (stopping.address.country) { fullAddress += ',' + stopping.address.country; }
      if (stopping.address.pincode) { fullAddress += ',' + stopping.address.pincode; }
    }
    if (fullAddress) {
      stopping.address['fullAddress'] = fullAddress;
    }
    cb();
  },
  beforeUpdate(stopping, cb) {
    if (!stopping.address) { return cb(); }

    // create full address from address object
    let fullAddress = '';
    if (stopping.address.streetLine1) {
      fullAddress += fullAddress + stopping.address.streetLine1;
      if (stopping.address.streetLine2) { fullAddress += ',' + stopping.address.streetLine2; }
      if (stopping.address.city) { fullAddress += ',' + stopping.address.city; }
      if (stopping.address.state) { fullAddress += ',' + stopping.address.state; }
      if (stopping.address.country) { fullAddress += ',' + stopping.address.country; }
      if (stopping.address.pincode) { fullAddress += ',' + stopping.address.pincode; }
    }
    if (fullAddress) {
      stopping.address['fullAddress'] = fullAddress;
    }
    cb();
  }

};

