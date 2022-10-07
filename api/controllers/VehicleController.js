/**
 * VehicleController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

async function createVehicle(requestBody, deviceDetails) {
  const resp =  await Vehicle.create({...requestBody});
  if (!!requestBody.device) {
    const ress =  _.pluck(deviceDetails, 'id');
    ress.push(resp.id);
    // eslint-disable-next-line no-unused-vars
    const payload = {
      deviceId: requestBody.device,
      vehicle: [...ress]
    };
    console.log('the payload is given as:', payload, requestBody);
    let result;
    try {
      result = await DeviceDetails.find({deviceId: requestBody.device});
    } catch (e) {
      console.log('the error is given as:', e);
    }
    console.log('the device detals is given as:', result);
    if (result.length > 0) {
      await DeviceDetails.updateOne({deviceId: requestBody.device}).set({...payload});
    } else {
      await DeviceDetails.create(payload);
    }
  }
  return resp;
}

async function updateDevice(req) {
  let deviceDetails = await DeviceDetails.findOne({ deviceId: req.body.device});
  if (!!deviceDetails) {
    let arr = [...deviceDetails.vehicle];
    arr.push(req.params.id);
    deviceDetails.vehicle = [...arr];
    await DeviceDetails.updateOne({deviceId: req.body.device}).set({...deviceDetails});
  } else {
      await DeviceDetails.create({ vehicle: [req.params.id], deviceId: req.body.device });
  }
}

module.exports = {
  addVehicle: async function(req, res) {
    if (!!req.body.device) {  // If the vehicle has device Id attached
      // then the device Id must be added in the deviceDetails table
      const value = await Vehicle.find({device: req.body.device});
      if(value.length > 0) {
        if (value[0].vehicleNumber === req.body.vehicleNumber) {
          // eslint-disable-next-line callback-return
          const resp =  await createVehicle({...req.body}, value);
          res.status(200).json({message: 'Vehicle created successfully', ...resp});
        } else {
          res.json({ error: 'Device Id is already associated with another vehicle' });
        }
      } else {
        const resp =  await createVehicle({...req.body}, []);
        res.status(200).json({message: 'Vehicle created successfully', ...resp});
      }
    } else {
      const resp =  await createVehicle({...req.body});
      res.status(200).json({message: 'Vehicle created successfully', ...resp});
    }
  },
  deleteVehicle: async function(req, res) {
    console.log('the vehicle is given as:', req.params.id, typeof(req.params.id));
    const value = await Vehicle.findOne({id: req.params.id});
    console.log('the vehicle is given as:', value);
    if (!!value) {
      let result;
      try {
        result = await DeviceDetails.findOne({deviceId: value.device});
        console.log('the result is given as:', result);
        if (!!result) {
          result.vehicle.splice(result.vehicle.findIndex(id => req.params.id === id), 1);
          console.log('the result is given as:', result);
          result.vehicle.length > 0 ?
          await DeviceDetails.updateOne({deviceId: value.device}).set({...result})
          : await DeviceDetails.destroy({id: result.id });
        }
        await Vehicle.destroy({id: req.params.id });
        res.status(200).json({message: 'Vehicle deleted successfully'});
      } catch(e) {
        throw e;
      }
    } else {
      res.status(400).json({ error: 'Vehicle details could not be found' });
    }
  },
  updateVehicle: async function (req, res) {
    try {
      if (req.body && req.params.id) {
        const value = await Vehicle.findOne({ id: req.params.id });
        console.log('the value is given asD:', value);
        var result = await DeviceDetails.findOne({ deviceId: value.device });
        console.log('the result is givne as2',result);
        if(!!result) {
          console.log('the result is givne as3',result);
          if ((result.deviceId === req.body.device)) {
            console.log('the result is givne as4',req.body.device);
            await Vehicle.updateOne({ id: value.id }).set({ ...req.body });
          } else {
            console.log('the result is givne as5',req.body.device, result.vehicle.findIndex(id => req.params.id === id));
            console.log('the result is given as 6');
            result.vehicle.splice(result.vehicle.findIndex(id => req.params.id === id) , 1);
            if (result.vehicle.length > 0) {
              await DeviceDetails.updateOne({ id: result.id }).set({ vehicle: [...result.vehicle] });
            } else {
              await DeviceDetails.destroy({id: result.id});
            }
            await Vehicle.updateOne({ id: value.id }).set({ ...req.body });
            if (!!req.body.device) {
            await updateDevice(req);
            }
          }
        } else {
          if (!!req.body.device) {
            await updateDevice(req);
          }
          await Vehicle.updateOne({id: req.params.id}).set({...req.body});
        }
        return res.ok('Vehicle updated succesfully');
        // } else {
        //   return res.ok('DeviceId already exist');
        // }
      } else {
        res.badRequest({ error: 'request cannot be a null' });
      }
    } catch (error) {
      throw error;
    }
  }
  // updateVehicle: async function (req, res) {
  //   try {
  //     if (req.body && req.params.id) {
  //       const value = await Vehicle.findOne({ id: req.params.id });
  //       if (value.device || req.body.device) {
  //         var result = await DeviceDetails.findOne({ deviceId: value.device });
  //         if ((result.deviceId === req.body.device)) {
  //           await Vehicle.updateOne({ id: value.id }).set({ ...req.body });
  //         } else {
  //           // eslint-disable-next-line no-unused-vars
  //           await Vehicle.updateOne({ id: value.id }).set({ ...req.body });
  //           let checkVehicle =  await DeviceDetails.getDatastore().sendNativeQuery(`select * from DeviceDetails where deviceId = '${req.body.device}' AND vehicle IN(${req.params.id})`);
  //           let addVehicle = result.vehicle.splice(result.vehicle.findIndex(id => req.body.vehicle === id), 1);
  //           checkVehicle.length > 0 ? await DeviceDetails.updateOne({ id: checkVehicle[0].id }).set({ vehicle: result.vehicle })
  //             : await DeviceDetails.create({ vehicle: addVehicle, deviceId: req.body.device });
  //         }
  //         return res.ok('Vehicle updated succesfully');
  //       } else {
  //         res.badRequest({ error: 'request cannot be a null' });
  //       }
  //     } else {
  //       let vehicle = await DeviceDetails.getDatastore().sendNativeQuery(`select * from DeviceDetails where "vehicle" IN(${req.params.id})`);
  //       if (vehicle) {
  //         vehicle.vehicle.splice(vehicle.vehicle.findIndex(id => req.body.vehicle === id), 1);
  //         await DeviceDetails.updateOne({ id: vehicle.id }).set({ vehicle: vehicle.vehicle });
  //       } else {
  //         await Vehicle.updateOne({ id: req.params.id }).set({ ...req.body });
  //       }
  //       return res.ok('Vehicle updated succesfully');
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }

};

