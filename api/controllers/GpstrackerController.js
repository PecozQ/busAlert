/* eslint-disable handle-callback-err */
/**
 * GpstrackerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  gpsTracker: async function(req, res) {
    var updatingObject = {
      latitude: req.body.latitude,
      longitude: req.body.longitude
    };
    try {
      var deviceDetail = await Gpstracker.findOne({ deviceId: req.body.deviceId });
      if (!deviceDetail) { // If the device details is not present
        updatingObject.deviceId = req.body.deviceId;
        var gpsCreate =  await Gpstracker.create(updatingObject).fetch();
        return res.status(200).json({ message: 'Created successfully', gpsCreate });
      } else {
        var updatedDeviceDetail = await Gpstracker.updateOne({ deviceId: req.body.deviceId }).set(updatingObject);
        return res.status(200).json({ message: 'Updated successfully', updatedDeviceDetail });
      }
    } catch(err) {
      return res.badRequest({ error: 'gpsTracker for device not created', err });
    }
  }
};

