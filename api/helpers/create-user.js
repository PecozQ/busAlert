var bcrypt = require('bcryptjs');
const uuidv1 = require('uuid/v1');

module.exports = {
  friendlyName: 'Create user',
  description: 'Create a new user.',

  inputs: {
    email: {
      type: 'string'
    },
    password: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    type: {
      type: 'string'
    }
  },

  exits: {
  },

  fn: async function (inputs, exits) {
    var attr = {
      id: uuidv1(),
      email: inputs.email.toLowerCase(),
    };

    if (inputs.password) {
      attr.password = await bcrypt.hash(inputs.password, 10);

      var user = await User.create(attr)
        .intercept('E_UNIQUE', () => 'emailAlreadyInUse')
        .intercept({ name: 'UsageError' }, () => 'invalid')
        .fetch();

      return exits.success(user);
    }
    else {
      return exits.invalid('Missing password.');
    }
  }
};
