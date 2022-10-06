/**
 * GeopositionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  positionActivity: async function (req, res) {
    if (req.body && req.body.activity) {
      Activity.findOne({ id: req.body.activity })
          .exec(async (err, activity) => {
            if (err) { return res.serverError(err); }
            if (!activity) { return res.badRequest({ error: 'Activity not found' }); }
            if (!activity.mapDetail) { return res.badRequest({ error: 'Mapdetails not found' }); }
            if (!activity.mapDetail.points) { return res.badRequest({ error: 'Mapdetail points not found' }); }
            let points = activity.mapDetail.points;
            let pointOccured = true;
            let reachMeter = 500;
            let maxRoadMeter = 20;
            let mapDetail = activity.mapDetail;
            if (mapDetail.isReachedEndPoint) {
              return res.badRequest({ error: 'End Location Reached' });
            }
            let oldPointIndex = (mapDetail.currentPointIndex - 1) >= 0 ? (mapDetail.currentPointIndex - 1) : 0;
            // mapDetail.currentPointIndex++;
            let currentNotifyUser = [];
            console.log('lat: ' + req.body.latitude + ', lng: ' + req.body.longitude);
            // check lat long avail in points
            while (pointOccured) {
              console.log('currentIndex in points -------> ', mapDetail.currentPointIndex);
              if (mapDetail.currentPointIndex >= points.length) {
                return res.badRequest({ error: 'Out of Route Points' });
              }
              // check the lat long reached the map start point
              if (!mapDetail.isReachedStartPoint) {
                let checkPoint = true;
                let startPoint = 0;
                let endPoint = 1;
                let checkedDistance = 0;
                while (checkPoint) {
                  console.log('start and end point', startPoint, '----', endPoint);
                  //check the lat long available in any points in given maximamum meter(reachMeter). eg: 500
                  if (checkDistanceDif(points[startPoint], points[endPoint],
                    { lat: req.body.latitude, lng: req.body.longitude }, maxRoadMeter)) {
                    mapDetail.isReachedStartPoint = true;
                    mapDetail.currentPointIndex = endPoint;
                    checkPoint = false;
                    pointOccured = false;
                    // check the user alert point is available before the startpoint
                    // for (j = mapDetail.currentPointIndex; j >= 0; j--) {
                    //   if (activity.notificationDetail &&
                    //     activity.notificationDetail.notifiyUser &&
                    //     activity.notificationDetail.notifiyUser.length) {
                    let users = _.filter(activity.notificationDetail.notifiyUser, (o) => {
                      return (o.alertpointIndex <= mapDetail.currentPointIndex && o.isNotified === false);
                    });
                    if (users && users.length) {
                      await checkPassengerList(users, mapDetail.currentPointIndex, req.body, activity, points);
                    }
                    //   }
                    // }
                    break;
                  } else {
                    checkedDistance += Math.round(distance(points[startPoint].lat, points[startPoint].lng,
                      points[endPoint].lat, points[endPoint].lng) * 1000);
                    if (checkedDistance >= reachMeter) {
                      break;
                    }
                    startPoint = endPoint;
                    endPoint++;
                  }
                }
                // check the distance between map first point and given lat long
                // and chec which is below than given maximamum meter(reachMeter). eg: 500
                if (checkPoint && checkedDistance >= 500) {
                  if (Math.abs(distance(points[oldPointIndex].lat, points[oldPointIndex].lng, req.body.latitude, req.body.longitude) * 1000) > 500) {
                    return res.badRequest({ error: 'Out of Range' });
                  }
                  break;
                }
              } else {
                // check lat long available in current point
                if (checkDistanceDif(points[oldPointIndex], points[mapDetail.currentPointIndex],
                  { lat: req.body.latitude, lng: req.body.longitude }, maxRoadMeter)) {
                  pointOccured = false;
                  // send notification to previous point
                  if (currentNotifyUser && currentNotifyUser.length) {
                    await checkPassengerList(currentNotifyUser, mapDetail.currentPointIndex, req.body, activity, points);
                  }
                  // check notify user is avialble in this point
                  if (activity.notificationDetail &&
                    activity.notificationDetail.notifiyUser &&
                    activity.notificationDetail.notifiyUser.length) {
                    currentNotifyUser = _.filter(activity.notificationDetail.notifiyUser, {
                      alertpointIndex: mapDetail.currentPointIndex, isNotified: false
                    });
                    if (currentNotifyUser && currentNotifyUser.length) {
                      await checkPassengerList(currentNotifyUser, mapDetail.currentPointIndex, req.body, activity, points);
                    }
                  }
                } else {
                  oldPointIndex = mapDetail.currentPointIndex;
                  mapDetail.currentPointIndex++;
                  continue;
                }
                let users = _.filter(activity.notificationDetail.notifiyUser, (o) => {
                  return (o.alertpointIndex <= oldPointIndex && o.isNotified === false);
                });
                if (users && users.length) {
                  await checkPassengerList(users, oldPointIndex, req.body, activity, points);
                }
              }
            }
            Activity.updateOne({ id: activity.id })
              .set({ mapDetail: mapDetail, notificationDetail: activity.notificationDetail }).exec((err) => {
                if (err) { return res.badRequest(err); }
                req.body['time'] = new Date().toLocaleTimeString('en-US');
                Geoposition.create(req.body).fetch().exec((err, geoposition) => {
                  if (err) { return res.badRequest(err); }
                  return res.json(geoposition);
                });
              });
          });
    } else {
      Geoposition.create(req.body).fetch()
          .exec((err, geoposition) => {
            if (err) { return res.badRequest(err); }
            sails.sockets.blast('geoposition', {
              verb: 'created',
              id: message.id,
              data: {
                text: message.text
              }
            }, env.req);
            return res.json(geoposition);
          });
    }
  }
};
/**
   *
   * @param {*} start
   * @param {*} end
   * @param {*} checkPoint
   * @param {*} diffMeter
   */
function checkDistanceDif(start, end, checkPoint, diffMeter) {
  if (!diffMeter) {
    diffMeter = 200;
  }
  console.log('distance', Math.abs(((distance(start.lat, start.lng, checkPoint.lat, checkPoint.lng, 'K') +
      distance(end.lat, end.lng, checkPoint.lat, checkPoint.lng, 'K')) -
      distance(start.lat, start.lng, end.lat, end.lng, 'K')) * 1000));
  return (Math.abs(((distance(start.lat, start.lng, checkPoint.lat, checkPoint.lng, 'K') +
      distance(end.lat, end.lng, checkPoint.lat, checkPoint.lng, 'K')) -
      distance(start.lat, start.lng, end.lat, end.lng, 'K')) * 1000) <= diffMeter);
}

function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0;
  }
  else {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') { dist = dist * 1.609344; }
    if (unit === 'N') { dist = dist * 0.8684; }
    return dist;
  }
}

async function checkPassengerList(notifyUsers, pointIndex, data, activity, points) {
  async.each(notifyUsers, async (notifyUser) => {
    if (!notifyUser.isNotified) {
      let calculatedDistance = 0;
      let isNotify = false;
      let notifyTime = '';

      // check alert point less than current point index
      if (notifyUser.alertpointIndex < pointIndex) {
        calculatedDistance = notifyUser.alertmeter;
        // if (notifyUser.alertpointIndex != 0) {
        let startpoint = notifyUser.alertpointIndex;
        for (i = startpoint + 1; i <= pointIndex; i++) {
          calculatedDistance += Math.abs((distance(points[startpoint].lat, points[startpoint].lng,
              points[i].lat, points[i].lng, 'K') * 1000));
          startpoint = i;
        }
        let traveledTime = calculatedDistance * points[pointIndex].timePerMeter;
        if (traveledTime > 30) {
          notifyTime = Math.round((notifyUser.time - traveledTime) / 60) + ' - ' + (notifyUser.time / 60);
        }
        // }
        isNotify = true;
      } else {

        // check alert meter reached
        calculatedDistance = (distance(data.latitude, data.longitude, points[pointIndex].lat,
            points[pointIndex].lng, 'K') * 1000);
        if (calculatedDistance <= (notifyUser.alertmeter + 15)) {
          isNotify = true;
        }
      }
      if (isNotify) {

        //update isNotified key to notify user
        notifyUser.isNotified = true;
        notifyUser.notifiedPoint = { latitude: data.latitude, longitude: data.longitude };
        notifyUser.notifiedDistance = calculatedDistance;

        let index = _.findIndex(activity.notificationDetail.notifiyUser, { id: notifyUser.id });
        activity.notificationDetail.notifiyUser[index] = notifyUser;

        //Send notification to caretaker
        await sails.helpers.notification.with({
          token: notifyUser.deviceDetail.deviceToken,
          payload: {
            time: notifyTime ? notifyTime : notifyUser.time / 60,
            location: notifyUser.address,
            name: notifyUser.name
          }
        });
      }
    }
  }, (err) => {
    if (err) { console.log(err); }
    // cb(err, activity);
  });
}
