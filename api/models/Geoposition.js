/**
 * Geoposition.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
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

async function checkPassengerList(notifyUsers, pointIndex, data, relationactivity, points) {
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

        let index = _.findIndex(relationactivity.notificationDetail.notifiyUser, { id: notifyUser.id });
        relationactivity.notificationDetail.notifiyUser[index] = notifyUser;

        //Send notification to caretaker
        await sails.helpers.notification.with({
          token: notifyUser.deviceDetail.deviceToken,
          payload: {
            time: notifyTime ? notifyTime : notifyUser.time / 60,
            location: notifyUser.address
          }
        });
      }
    }
  }, (err) => {
    if (err) { console.log(err); }
    // cb(err, relationactivity);
  });
}
module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    latitude: {
      type: 'ref',
      columnType: 'float8'
    },
    longitude: {
      type: 'ref',
      columnType: 'float8'
    },
    time: {
      type: 'string',
      allowNull: true
    },
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    activity: {
      model: 'activity'
    }
  },
  beforeCreate: async function (data, next) {
    if (data.relationactivity) {
      Relationactivity.findOne({ id: data.relationactivity })
        .exec(async (err, relationactivity) => {
          if (err) { return next(err); }
          if (!relationactivity) { return next({error: 'Relation activity not found'}); }
          let points = relationactivity.mapDetail.points;
          let pointOccured = true;
          let reachMeter = 500;
          let maxRoadMeter = 10;
          let mapDetail = relationactivity.mapDetail;
          if (mapDetail.isReachedEndPoint) {
            return next({ error: 'End Location Reached' });
          }

          console.log('data', data.latitude, ',  ', data.longitude);
          let oldPointIndex = (mapDetail.currentPointIndex - 1) >= 0 ? (mapDetail.currentPointIndex - 1) : 0;
          // mapDetail.currentPointIndex++;
          let currentNotifyUser = [];

          // check lat long avail in points
          while (pointOccured) {
            console.log('currentIndex in points -------> ', mapDetail.currentPointIndex);
            if (mapDetail.currentPointIndex >= points.length) {
              return next({ error: 'Out of Route Points' });
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
                  { lat: data.latitude, lng: data.longitude }, maxRoadMeter)) {
                  mapDetail.isReachedStartPoint = true;
                  mapDetail.currentPointIndex = endPoint;
                  checkPoint = false;
                  pointOccured = false;
                  // check the user alert point is available before the startpoint
                  for (j = mapDetail.currentPointIndex; j >= 0; j--) {
                    if (relationactivity.notificationDetail &&
                      relationactivity.notificationDetail.notifiyUser &&
                      relationactivity.notificationDetail.notifiyUser.length) {
                      let users = _.filter(relationactivity.notificationDetail.notifiyUser, {
                        alertpointIndex: j, isNotified: false
                      });
                      if (users && users.length) {
                        await checkPassengerList(users, mapDetail.currentPointIndex, data, relationactivity, points);
                      }
                    }
                  }
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
                if (Math.abs(distance(points[oldPointIndex].lat, points[oldPointIndex].lng, data.latitude, data.longitude) * 1000) > 500) {
                  return next({ error: 'Out of Range' });
                }
                break;
              }
            } else {
              // check lat long available in current point
              if (checkDistanceDif(points[oldPointIndex], points[mapDetail.currentPointIndex],
                { lat: data.latitude, lng: data.longitude }, maxRoadMeter)) {
                pointOccured = false;

                // send notification to previous point
                if (currentNotifyUser && currentNotifyUser.length) {
                  await checkPassengerList(currentNotifyUser, mapDetail.currentPointIndex, data, relationactivity, points);
                }

                // check notify user is avialble in this point
                if (relationactivity.notificationDetail &&
                  relationactivity.notificationDetail.notifiyUser &&
                  relationactivity.notificationDetail.notifiyUser.length) {
                  currentNotifyUser = _.filter(relationactivity.notificationDetail.notifiyUser, {
                    alertpointIndex: mapDetail.currentPointIndex, isNotified: false
                  });
                  if (currentNotifyUser && currentNotifyUser.length) {
                    await checkPassengerList(currentNotifyUser, mapDetail.currentPointIndex, data, relationactivity, points);
                  }
                }
              } else {
                oldPointIndex = mapDetail.currentPointIndex;
                mapDetail.currentPointIndex++;
                continue;
              }
            }
          }
          await Relationactivity.updateOne({ id: relationactivity.id })
            .set({ mapDetail: mapDetail, notificationDetail: relationactivity.notificationDetail });
          return next();
        });
    } else {
      return next();
    }
  }
};

