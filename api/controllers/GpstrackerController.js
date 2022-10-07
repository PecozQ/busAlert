/* eslint-disable handle-callback-err */
/**
 * GpstrackerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
function gpsDataUpdate(data, res)  {
  return new Promise((resolve, reject) => {
    async.each(data, async (dataItr) => {
        var updatingObject = {
          latitude: dataItr.latitude,
          longitude: dataItr.longitude
        };
        try {
          var deviceDetail = await Gpstracker.findOne({ deviceId: dataItr.deviceId });
          if (!deviceDetail) { // If the device details is not present
            updatingObject.deviceId = dataItr.deviceId;
            var gpsCreate =  await Gpstracker.create(updatingObject).fetch();
            // updatedData.push(...gpsCreate);
            // return res.status(200).json({ message: 'Created successfully', gpsCreate });
          } else {
            var updatedDeviceDetail = await Gpstracker.updateOne({ deviceId: dataItr.deviceId }).set(updatingObject);
            // updatedData.push(...updatedDeviceDetail);
            // return res.status(200).json({ message: 'Updated successfully', updatedDeviceDetail });
          }
        } catch(err) {
          reject(err);
        }
      }, (err) => {
        if (err) { 
          reject(err);
         }
         resolve('success');
        // cb(err, activity);
      });
    });
}
module.exports = {
  gpsTracker: async function(req, res) {
    if (req.body.data.length === 0) {
      return res.badRequest({ error: 'No data is present to update' });
    }
    gpsDataUpdate(req.body.data).then((resp) => {
      return res.status(200).json({message: 'Created successfully'});
    }).catch((err) => {
      return res.badRequest(err);
    });
  }
};

