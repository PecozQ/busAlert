/**
 * VehicleDetailsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  addDevice: async function(req, res) {
    console.log('the request body is given as:', req.body);
    // eslint-disable-next-line no-unused-vars
    var updatingObject = {
      driver: req.body.driverId,
      vehicle: req.body.vehicleId
    };
    var vehicleDetails = VehicleDetails.findOne({ driver: req.body.driverId });
    var driverDetails = VehicleDetails.findOne({ vehicle: req.body.vehicleId });
    if (vehicleDetails) {
      return res.badRequest({ error: 'vehicle is already associated with another device '});
    }
    if (driverDetails) {
      return res.badRequest({ error: 'Driver is already associated with another device' });
    }
    var deviceDetail = await VehicleDetails.updateOne({ deviceId: req.body.deviceId })
                             .set(updatingObject);
    if (!deviceDetail) {
      updatingObject.deviceId = req.body.deviceId;
      await VehicleDetails.create(updatingObject).fetch().then((result) => {
        return res.status(200).json({ message: 'Created successfully', result });
      }).catch((err) => {
        return res.badRequest({ error: 'device details not added', err });
      });
    } else {
      return res.status(200).json({ message: 'Updated successfully', deviceDetail });
    }
  }

};

