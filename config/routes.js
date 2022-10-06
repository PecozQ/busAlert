/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },
  'GET /login': { view: 'pages/login' },
  'GET /logout': 'AuthController.logout',
  'GET /register': { view: 'pages/register' },
  'GET /dashboard': 'DashboardController.renderIndex',
  'GET /auth/google': 'AuthController.google',
  'GET /auth/google/callback': 'AuthController.social',


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/

  'POST /login': 'AuthController.login',
  'POST /register': 'AuthController.register',
  'POST /api/v1/login': 'UserController.login',
  'POST /api/v1/logout': 'UserController.logout',
  'POST /api/v1/register': 'UserController.register',
  'POST /api/v1/checkNumber': 'UserController.checkNumber',
  'POST /api/v1/relation/start': 'ActivityController.start',
  'GET /api/v1/refreshToken': 'UserController.refreshToken',
  'POST /api/v1/relation/end': 'ActivityController.end', //realtion end update the end time in relation activity model
  'POST /api/v1/geoposition': 'GeopositionController.positionActivity',
  'POST /api/v1/getPassengerDetail': 'PassengerController.getPassengers',
  'POST /api/v1/updatePassengerDetail': 'PassengerController.updatePassenger',
  'POST /api/v1/media/upload': 'CommonController.mediaUpload',
  'POST /api/v1/bulkInsert': 'CommonController.bulkInsert',
  'GET /api/v1/passengerLocation': 'PassengerController.passengerLocation',
  'GET /api/v1/vehicleLocation': 'PassengerController.vehicleLocation',
  'POST /api/v1/gpsTracker': 'GpstrackerController.gpsTracker',
  'POST /api/v1/addDevice': 'VehicleDetailsController.addDevice',
  'POST /api/v1/addVehicle': 'VehicleController.addVehicle',
  'POST /api/v1/deleteVehicle/:id': 'VehicleController.deleteVehicle',
  'PUT /api/v1/updateVehicle/:id': 'VehicleController.updateVehicle'
};
