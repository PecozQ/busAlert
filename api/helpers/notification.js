var admin = require('firebase-admin');

var serviceAccount = require('../../config/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: sails.config.custom.baseUrl
});
serviceAccount.json;
module.exports = {


  friendlyName: 'Notification',


  description: 'Notification something.',


  inputs: {
    token: {
      type: 'string'
    },
    payload: {
      type: 'json'
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },
    error: {
      description: 'error'
    }

  },

  fn: async function (inputs, exits) {
    // This registration token comes from the client FCM SDKs.
    var registrationToken = inputs.token;

    var message = {
      data: {
        title: `${inputs.payload.time} mins to reach ....!`,
        body: `Your child ${inputs.payload.name} will reach in ${inputs.payload.time} mins at ${inputs.payload.location}`
      },
      token: registrationToken
    };

    // Send a message to the device corresponding to the provided
    // registration token.
    return await admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
        return exits.success(response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
        return exits.error(error);
      });
  }


};

