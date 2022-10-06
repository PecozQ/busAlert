/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // sendgridSecret: 'SG.fake.3e0Bn0qSQVnwb1E4qNPz9JZP5vLZYqjh7sn8S93oSHU',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

  baseUrl: 'https://tracker.whatsdare.com',
  // baseUrl: 'http://192.168.0.163:1337',
  firebaseURL: 'https://bus-alert-8b75e.firebaseio.com',
  directionAPIUrl: 'https://maps.googleapis.com/maps/api/directions/json?',
  googleAPIKey: 'AIzaSyAHJfi7jq7Tcc7v4wDdz5Zj8i9cS75FGhg',
  wayPoinCount: 25,
  google: {
    clientID: '704934498147-oihltj0dcbtp2rordlrvqavnbh4uaaku.apps.googleusercontent.com',
    clientSecret: 'x_uMViGljDT_Th76iYCrjy5t',
    callbackURL: 'http://localhost:1337/auth/google/callback'
  },
  jwtSecretKey: 'the_secret_key_BUS_Alert'

};
