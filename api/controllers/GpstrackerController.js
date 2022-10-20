/* eslint-disable handle-callback-err */
/**
 * GpstrackerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
// function gpsDataUpdate(data, res)  {
//   return new Promise((resolve, reject) => {
//     async.each(data, async (dataItr) => {
//         var updatingObject = {
//           latitude: dataItr.latitude,
//           longitude: dataItr.longitude
//         };
//         try {
//           var deviceDetail = await Gpstracker.findOne({ deviceId: dataItr.deviceId });
//           if (!deviceDetail) { // If the device details is not present
//             updatingObject.deviceId = dataItr.deviceId;
//             var gpsCreate =  await Gpstracker.create(updatingObject).fetch();
//             // updatedData.push(...gpsCreate);
//             // return res.status(200).json({ message: 'Created successfully', gpsCreate });
//           } else {
//             var updatedDeviceDetail = await Gpstracker.updateOne({ deviceId: dataItr.deviceId }).set(updatingObject);
//             // updatedData.push(...updatedDeviceDetail);
//             // return res.status(200).json({ message: 'Updated successfully', updatedDeviceDetail });
//           }
//         } catch(err) {
//           reject(err);
//         }
//       }, (err) => {
//         if (err) { 
//           reject(err);
//          }
//          resolve('success');
//         // cb(err, activity);
//       });
//     });
// }
// module.exports = {
//   gpsTracker: async function(req, res) {
//     if (req.body.data.length === 0) {
//       return res.badRequest({ error: 'No data is present to update' });
//     }
//     gpsDataUpdate(req.body.data).then((resp) => {
//       return res.status(200).json({message: 'Created successfully'});
//     }).catch((err) => {
//       return res.badRequest(err);
//     });
//   }
// };

var device = async (dataItr) => {
  var getDevice = await DeviceDetails.findOne({ deviceId: dataItr.deviceId });
  if (!!getDevice) {
    await DeviceDetails.updateOne({ id: getDevice.id }).set({ latitude: dataItr.latitude, longitude: dataItr.longitude });
    const payload = {
      activity: getDevice.activity,
      latitude: dataItr.latitude,
      longitude: dataItr.longitude
    }
    if (!!getDevice.activity) {
      return Geoposition.create(payload).fetch();
    }
    return { message: 'activity ID not found' };
  } else {
    await DeviceDetails.create({latitude: dataItr.latitude, longitude: dataItr.longitude, deviceId: dataItr.deviceId, vehicle: []});
    return { message: 'activity ID not found' };
    // geoposition api will not be called here as this will not have activityId
    // return { message: }
  }
}

module.exports = {
  gpsTracker: async function (req, res) {
    if (Array.isArray(req.body.data) && req.body.data.length > 0) {
      var result = await Promise.all(req.body.data.map(async (item) => {
        var updatingObject = {
          latitude: item.latitude,
          longitude: item.longitude
        };
        var deviceDetail = await Gpstracker.findOne({ deviceId: item.deviceId });
        if (!deviceDetail) {
          updatingObject.deviceId = item.deviceId;
          await Gpstracker.create(updatingObject).fetch();
          return device(item);
        } else {
          await Gpstracker.updateOne({ deviceId: item.deviceId }).set(updatingObject);
          return device(item);
        }
      }));
      res.ok(result);
    } else {
      return res.badRequest({ error: 'No data is present to update' });
    }
  }
}