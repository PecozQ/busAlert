/**
 * GeopositionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  positionActivity: async function (req, res) {
    positionActivityHelper(req.body.activity, req.body.latitude, req.body.longitude)
    .then((resp) => {
       return res.json(resp);
    })
    .catch((e) => {
      return res.badRequest(e);
    })
  },
  positionActivityHelpers: async function(activityId, latitude, longitude) {
    return new Promise((resolve, reject) => {
      positionActivityHelper(activityId, latitude, longitude)
      .then((resp) => {
        console.log('the resp is given as:', resp);
        resolve(resp);
      })
      .catch((e) => {
        reject(e);
      })
    })
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

function positionActivityHelper(activityId, latitude, longitude) {
  return new Promise((resolve, reject) => {
    let data = {
      latitude: latitude,
      longitude: longitude,
      activity: activityId
    }
    console.log('the activity id is givne as:', activityId);
    if (!!activityId) {
      console.log('the activityid is present:', activityId);
      Activity.findOne({ id: activityId })
      .exec(async (err, activity) => {
        console.log('the activity is givne as:', activity);
        if (err) { reject(err); }
        if (!activity) { reject({ error: 'Activity not found' }); }
        if (!activity.mapDetail) {  reject({ error: 'Mapdetails not found' }); }
        if (!activity.mapDetail.points) { reject({ error: 'Mapdetail points not found' }); }
        let points = activity.mapDetail.points;
        let pointOccured = true;
        let reachMeter = 500;
        let maxRoadMeter = 20;
        let mapDetail = activity.mapDetail;
        if (mapDetail.isReachedEndPoint) {
          reject({ error: 'End Location Reached' });
        }
        let oldPointIndex = (mapDetail.currentPointIndex - 1) >= 0 ? (mapDetail.currentPointIndex - 1) : 0;
        // mapDetail.currentPointIndex++;
        let currentNotifyUser = [];
        console.log('lat: ' + latitude + ', lng: ' + longitude);
        // check lat long avail in points
        while (pointOccured) {
          console.log('currentIndex in points -------> ', mapDetail.currentPointIndex);
          if (mapDetail.currentPointIndex >= points.length) {
            reject({ error: 'Out of Route Points' });
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
                { lat: latitude, lng: longitude }, maxRoadMeter)) {
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
                  await checkPassengerList(users, mapDetail.currentPointIndex, data, activity, points);
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
              if (Math.abs(distance(points[oldPointIndex].lat, points[oldPointIndex].lng, latitude, longitude) * 1000) > 500) {
                reject({ error: 'Out of Range' });
              }
              break;
            }
          } else {
            // check lat long available in current point
            if (checkDistanceDif(points[oldPointIndex], points[mapDetail.currentPointIndex],
              { lat: latitude, lng: longitude }, maxRoadMeter)) {
              pointOccured = false;
              // send notification to previous point
              if (currentNotifyUser && currentNotifyUser.length) {
                await checkPassengerList(currentNotifyUser, mapDetail.currentPointIndex, data, activity, points);
              }
              // check notify user is avialble in this point
              if (activity.notificationDetail &&
                activity.notificationDetail.notifiyUser &&
                activity.notificationDetail.notifiyUser.length) {
                currentNotifyUser = _.filter(activity.notificationDetail.notifiyUser, {
                  alertpointIndex: mapDetail.currentPointIndex, isNotified: false
                });
                if (currentNotifyUser && currentNotifyUser.length) {
                  await checkPassengerList(currentNotifyUser, mapDetail.currentPointIndex, data, activity, points);
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
              await checkPassengerList(users, oldPointIndex, data, activity, points);
            }
          }
        }
        Activity.updateOne({ id: activity.id })
          .set({ mapDetail: mapDetail, notificationDetail: activity.notificationDetail }).exec((err) => {
            if (err) { reject(err); }
            data['time'] = new Date().toLocaleTimeString('en-US');
            Geoposition.create(data).fetch().exec((err, geoposition) => {
              if (err) { reject(err); }
              resolve(geoposition);
            });
          });
      });
    } else {
      console.log('the activityid is not present:', activityId);
      Geoposition.create(data).fetch()
          .exec((err, geoposition) => {
            if (err) { reject(err); }
            sails.sockets.blast('geoposition', {
              verb: 'created',
              id: message.id,
              data: {
                text: message.text
              }
            }, env.req);
            resolve(geoposition);
          });
    }
  });
}
