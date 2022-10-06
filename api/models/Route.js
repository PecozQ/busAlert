/**
 * Route.js
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
      isIn: ['Pickup', 'Drop'],
      defaultsTo: 'Pickup'
    },
    startPoint: {
      type: 'json',
    },
    endPoint: {
      type: 'json',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    stopping: {
      collection: 'stopping',
      via: 'route',
      through: 'routestopping'
    },
    branch: {
      model: 'branch',
    },
    passenger: {
      collection: 'passenger',
      via: 'route'
    },
    vehicle: {
      collection: 'vehicle',
      via: 'route'
    }
  },
  beforeCreate: function (route, cb) {
    if (!route.startPoint) { return cb(); }

    let startAddress = '';
    if (route.startPoint.streetLine1) {
      startAddress += startAddress + route.startPoint.streetLine1;
      if (route.startPoint.streetLine2) { startAddress += ',' + route.startPoint.streetLine2; }
      if (route.startPoint.city) { startAddress += ',' + route.startPoint.city; }
      if (route.startPoint.state) { startAddress += ',' + route.startPoint.state; }
      if (route.startPoint.country) { startAddress += ',' + route.startPoint.country; }
      if (route.startPoint.pincode) { startAddress += ',' + route.startPoint.pincode; }
    }
    if (startAddress) {
      route.startPoint['fullAddress'] = startAddress;
    }

    let stopAddress = '';
    if (route.endPoint.streetLine1) {
      stopAddress += stopAddress + route.endPoint.streetLine1;
      if (route.endPoint.streetLine2) { stopAddress += ',' + route.endPoint.streetLine2; }
      if (route.endPoint.city) { stopAddress += ',' + route.endPoint.city; }
      if (route.endPoint.state) { stopAddress += ',' + route.endPoint.state; }
      if (route.endPoint.country) { stopAddress += ',' + route.endPoint.country; }
      if (route.endPoint.pincode) { stopAddress += ',' + route.endPoint.pincode; }
    }
    if (stopAddress) {
      route.endPoint['fullAddress'] = stopAddress;
    }
    cb();
  },
  beforeUpdate(route, cb) {
    if (!route.startPoint) { return cb(); }

    let startAddress = '';
    if (route.startPoint.streetLine1) {
      startAddress += startAddress + route.startPoint.streetLine1;
      if (route.startPoint.streetLine2) { startAddress += ',' + route.startPoint.streetLine2; }
      if (route.startPoint.city) { startAddress += ',' + route.startPoint.city; }
      if (route.startPoint.state) { startAddress += ',' + route.startPoint.state; }
      if (route.startPoint.country) { startAddress += ',' + route.startPoint.country; }
      if (route.startPoint.pincode) { startAddress += ',' + route.startPoint.pincode; }
    }
    if (startAddress) {
      route.startPoint['fullAddress'] = startAddress;
    }

    let stopAddress = '';
    if (route.endPoint.streetLine1) {
      stopAddress += stopAddress + route.endPoint.streetLine1;
      if (route.endPoint.streetLine2) { stopAddress += ',' + route.endPoint.streetLine2; }
      if (route.endPoint.city) { stopAddress += ',' + route.endPoint.city; }
      if (route.endPoint.state) { stopAddress += ',' + route.endPoint.state; }
      if (route.endPoint.country) { stopAddress += ',' + route.endPoint.country; }
      if (route.endPoint.pincode) { stopAddress += ',' + route.endPoint.pincode; }
    }
    if (stopAddress) {
      route.endPoint['fullAddress'] = stopAddress;
    }
    cb();
  }

};

