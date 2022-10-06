/**
 * Passenger.js
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
    deviceDetail: {
      type: 'json'
    },
    address: {
      type: 'json'
    },
    caretakerCount: {
      type: 'number',
      allowNull: true
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    pickupStopping: {
      model: 'stopping',
    },
    dropStopping: {
      model: 'stopping',
    },
    route: {
      collection: 'route',
      via: 'passenger'
    },
    branch: {
      model: 'branch',
    },
    organization: {
      model: 'organization'
    },
    caretakers: {
      collection: 'caretaker',
      via: 'passenger',
      through: 'passengercaretaker'
    },
  },
  beforeCreate: async function (passenger, cb) {
    // check caretaker is already registered
    try {
      if (passenger.phoneNumber) {
        const caretaker = await Profile.getDatastore().sendNativeQuery(`
          select c.id from profile p inner join caretaker c on c.profile=p.id where p."phoneNumber"='${passenger.phoneNumber}';
        `);
        if (caretaker && caretaker.rows && caretaker.rows.length) {
          passenger.extraData = { notificationDetails: {} };
          _.forEach(caretaker.rows, (caretaker) => {
            let updateData = {
              notifyTime: 5,
              caretaker: caretaker.id
            };
            passenger.extraData.notificationDetails[caretaker.id] = updateData;
          });
          passenger.caretakers = _.pluck(caretaker.rows, 'id');
        }
      }
    } catch (err) {
      return cb(err);
    }

    // create full address from address object
    if (passenger.address) {
      let fullAddress = '';
      if (passenger.address.streetLine1) {
        fullAddress += fullAddress + passenger.address.streetLine1;
        if (passenger.address.streetLine2) { fullAddress += ',' + passenger.address.streetLine2; }
        if (passenger.address.city) { fullAddress += ',' + passenger.address.city; }
        if (passenger.address.state) { fullAddress += ',' + passenger.address.state; }
        if (passenger.address.country) { fullAddress += ',' + passenger.address.country; }
        if (passenger.address.pincode) { fullAddress += ',' + passenger.address.pincode; }
      }
      if (fullAddress) {
        passenger.address['fullAddress'] = fullAddress;
      }
    }

    // Combine firstName middleName and lastName in name
    if (passenger.firstName) {
      passenger.name = passenger.firstName;
    }
    if (passenger.middleName) {
      passenger.name += ' ' + passenger.middleName;
    }
    if (passenger.lastName) {
      passenger.name += ' ' + passenger.lastName;
    }
    cb();
  },
  beforeUpdate: async function (passenger, cb) {
    let oldData = {};
    if (passenger.id) {
      try {
        oldData = await Passenger.findOne({ id: passenger.id });
        // update caretaker association
        if (passenger.phoneNumber && oldData.phoneNumber !== passenger.phoneNumber) {
          await Passengercaretaker.destroy({ passenger: passenger.id });
          const caretaker = await Profile.getDatastore().sendNativeQuery(`
            select c.id from profile p inner join caretaker c on c.profile=p.id where p."phoneNumber"='${passenger.phoneNumber}';
          `);
          if (caretaker && caretaker.rows && caretaker.rows.length) {
            passenger.extraData = { notificationDetails: {} };
            _.forEach(caretaker.rows, (caretaker) => {
              let updateData = {
                notifyTime: 5,
                caretaker: caretaker.id
              };
              passenger.extraData.notificationDetails[caretaker.id] = updateData;
            });
            passenger.caretakers = _.pluck(caretaker.rows, 'id');
          }
        }
      } catch (err) {
        return cb(err);
      }
    }

    // create full address from address object
    if (passenger.address) {
      let fullAddress = '';
      if (passenger.address.streetLine1) {
        fullAddress += fullAddress + passenger.address.streetLine1;
        if (passenger.address.streetLine2) { fullAddress += ',' + passenger.address.streetLine2; }
        if (passenger.address.city) { fullAddress += ',' + passenger.address.city; }
        if (passenger.address.state) { fullAddress += ',' + passenger.address.state; }
        if (passenger.address.country) { fullAddress += ',' + passenger.address.country; }
        if (passenger.address.pincode) { fullAddress += ',' + passenger.address.pincode; }
      }
      if (fullAddress) {
        passenger.address['fullAddress'] = fullAddress;
      }
    }

    // Combine firstName middleName and lastName in name
    if (passenger.firstName || passenger.middleName || passenger.lastName) {
      Passenger.findOne({ id: passenger.id }).exec((err, oldData) => {
        if (err) { return cb(err); }
        if (passenger.firstName || oldData.firstName) {
          passenger.name = passenger.firstName || oldData.firstName;
        }
        if (passenger.middleName || oldData.middleName) {
          passenger.name += ' ' + (passenger.middleName || oldData.middleName);
        }
        if (passenger.lastName || oldData.lastName) {
          passenger.name += ' ' + (passenger.lastName || oldData.lastName);
        }
        return cb();
      });
    } else {
      return cb();
    }
  }

};

