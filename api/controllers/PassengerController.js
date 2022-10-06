/**
 * PassengerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  getPassengers: async function (req, res) {
    if (!req.body.phoneNumber || !req.body.countryCode) {
      res.badRequest({ error: 'Phone Number or Country Code not found' });
    }
    try {
      let caretaker = await Caretaker.find({ profile: req.profile.id }).populate('passengers.pickupStopping&dropStopping&route');
      if (!caretaker || !caretaker.length) {
        res.badRequest({ error: 'Your not a caretaker!' });
      }
      let passengers = (caretaker && caretaker.length) ? caretaker[0].passengers : [];
      if (!passengers || !passengers.length) {
        return res.ok([]);
      }
      _.map(passengers, async (passenger) => {
        if (!passenger.extraData || !passenger.extraData.notificationDetails) {
          passenger.extraData = { ...passenger.extraData, notificationDetails: {} };
        }
        if (passenger.extraData.notificationDetails[caretaker[0].id]) {
          passenger.notificationDetails = [passenger.extraData.notificationDetails[caretaker[0].id]];
        } else {
          updateData = {
            notifyTime: 5,
            caretaker: caretaker[0].id,
          };
          passenger.extraData.notificationDetails[caretaker[0].id] = updateData;
          await Passenger.updateOne({ id: passenger.id }).set({ extraData: passenger.extraData });
          passenger.notificationDetails = [updateData];
        }
        return passenger;
      });
      return res.ok(passengers);
    } catch (err) {
      return res.badRequest(err);
    }
  },
  updatePassenger: async function (req, res) {
    if (!req.body.careTaker || !req.body.notifyTime) {
      return res.badRequest({ error: 'Caretaker or notifyTime not found' });
    }
    try {
      let passenger = await Passenger.findOne({ id: req.body.id });
      if (!passenger) {
        return res.badRequest({ error: 'Student not found' });
      }
      let caretaker = await Caretaker.find({ id: req.body.careTaker });
      if (!caretaker) {
        return res.badRequest({ error: 'Caretaker not found' });
      }
      let availableData = {};
      if (passenger.extraData && passenger.extraData.notificationDetails && passenger.extraData.notificationDetails[req.body.careTaker]) {
        availableData = passenger.extraData.notificationDetails[req.body.careTaker];
      }
      let updateData = {
        ...availableData,
        notifyTime: req.body.notifyTime,
        caretaker: req.body.careTaker
      };
      if (req.body.extraData) {
        updateData['extraData'] = req.body.extraData;
      }
      if (!passenger.extraData) {
        passenger.extraData = {
          notificationDetails: {}
        };
      } else if (!passenger.extraData.notificationDetails) {
        passenger.extraData.notificationDetails = {};
      }
      passenger.extraData.notificationDetails[req.body.careTaker] = updateData;
      let updatedDetail = await Passenger.updateOne({
        id: req.body.id
      }).set({ extraData: passenger.extraData });
      return res.ok(updatedDetail);
    } catch (err) {
      return res.badRequest(err);
    }
  },
  passengerLocation: async function (req, res) {
    if (req.query && req.query.passenger) {
      Passenger.findOne({ id: req.query.passenger }).exec((err, passenger) => {
        if (err) { return res.badRequest(err); }
        if (!passenger) { return res.badRequest({ error: 'Student not found!' }); }
        let condition = '';
        if (req.query.startDate && req.query.endDate) {
          condition = ` and a."createdAt" >= '${req.query.startDate}' and a."createdAt" <= '${req.query.endDate}'`;
        }
        Passenger.getDatastore().sendNativeQuery(`
            select a.* from activity a
              inner join route r on r.id = a.route
              inner join passenger_route__route_passenger pr on pr.passenger_route='${passenger.id}' 
                and pr.route_passenger=r.id
            where a."startTime" is not null and a."endTime" is null ${condition}
            order by a."createdAt" desc limit 1
          `).exec((err, result) => {
          if (err) { return res.badRequest(err); }
          return res.ok(result.rows.length ? result.rows[0] : {});
        });
      });
    } else {
      return res.badRequest({ error: 'Passenger Id not found!' });
    }
  },
  vehicleLocation: async function (req, res) {
    if (req.query && req.query.activity) {
      Activity.findOne({ id: req.query.activity }).exec((err, activity) => {
        if (err) { return res.badRequest(err); }
        if (!activity) { return res.badRequest({ error: 'Activity not found!' }); }
        if (activity.endTime) { return res.badRequest({ error: 'Activity Closed or Completed!' }); }
        Geoposition.find({
          where: { activity: activity.id },
          skip: 0,
          limit: 1,
          sort: 'createdAt DESC'
        }).exec((err, geoposition) => {
          if (err) { return res.badRequest(err); }
          return res.ok(geoposition.length ? geoposition[0] : {});
        });
      });
    } else {
      return res.badRequest({ error: 'Activity Id not found!' });
    }
  }
};
