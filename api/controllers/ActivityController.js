/**
 * ActivityController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var request = require('request');
const queryString = require('query-string');
// calculate distance between two point
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
// finding the nearest leg and step based on adding time reverse order upto known points
// next convert remaining time to distance and find the point index to send notification
function findNotificationLocation(mapData, lat, long, order, time, points) {
  let dataobj = {
    stoppingPoint: {
      latitude: lat,
      longitude: long
    },
    nearestPoint: {},
    order: order,
    time: time,
    isNotified: false
  };
  let remainingTime = time;
  dataobj.alertpointIndex = 0;
  dataobj.alertmeter = 0;
  dataobj.calculatedTime = 0;
  dataobj.alertlegIndex = 0;
  dataobj.alertstepIndex = 0;
  var legs = mapData.routes[0].legs;
  let stopLoop = false;
  for (i = order - 1; (i >= 0 && !stopLoop); i--) {
    var steps = legs[i].steps;
    if ((legs[i].duration && legs[i].duration.value) < remainingTime) {
      dataobj.calculatedTime += legs[i].duration.value;
      remainingTime -= legs[i].duration.value;
      continue;
    } else if ((legs[i].duration && legs[i].duration.value) === remainingTime) {
      dataobj.calculatedTime += legs[i].duration.value;
      remainingTime -= legs[i].duration.value;
      dataobj.alertlegIndex = i > 0 ? i - 1 : 0;
      dataobj.alertstepIndex = i > 0 ? (legs[dataobj.alertlegIndex].steps.length > 0 ? legs[dataobj.alertlegIndex].steps.length - 1 : 0) : 0;
      if (i > 0) {
        dataobj.alertpointIndex = legs[dataobj.alertlegIndex].steps[dataobj.alertstepIndex].end_point_index;
      } else {
        dataobj.alertpointIndex = 0;
        dataobj.alertmeter = Math.abs(distance(points[0].lat, points[0].lng, points[1].lat, points[1].lng) * 1000);
      }
      stopLoop = true;
      break;
    }
    for (j = steps.length - 1; (j >= 0 && !stopLoop); j--) {
      if ((steps[j].duration && steps[j].duration.value) < remainingTime) {
        dataobj.calculatedTime += steps[j].duration.value;
        remainingTime -= steps[j].duration.value;
        continue;
      } else if ((steps[j].duration && steps[j].duration.value) === remainingTime) {
        dataobj.calculatedTime += steps[j].duration.value;
        remainingTime -= steps[j].duration.value;
        dataobj.alertlegIndex = i;
        dataobj.alertstepIndex = j > 0 ? j - 1 : 0;
        if (j > 0) {
          dataobj.alertpointIndex = legs[dataobj.alertlegIndex].steps[dataobj.alertstepIndex].end_point_index;
        } else {
          dataobj.alertpointIndex = legs[dataobj.alertlegIndex].steps[dataobj.alertstepIndex].start_point_index;
          dataobj.alertmeter = Math.abs(distance(points[dataobj.alertpointIndex].lat, points[dataobj.alertpointIndex].lng,
             points[dataobj.alertpointIndex + 1].lat, points[dataobj.alertpointIndex + 1].lng) * 1000);
        }
        stopLoop = true;
        break;
      }
      let remainingTimeinPercentage = (remainingTime / steps[j].duration.value) * 100;
      let remainingDistance = Math.round((steps[j].distance.value / 100) * remainingTimeinPercentage);
      dataobj.alertlegIndex = i;
      dataobj.alertstepIndex = j;
      dataobj.calculatedDistance = remainingDistance;
      let oldk = steps[j].end_point_index;
      for (k = steps[j].end_point_index - 1; (k >= steps[j].start_point_index && !stopLoop); k--) {
        let pointDis = Math.round(distance(points[oldk].lat, points[oldk].lng, points[k].lat, points[k].lng) * 1000);
        oldk = k;
        if (pointDis < remainingDistance) {
          remainingDistance -= pointDis;
          continue;
        } else if (pointDis === remainingDistance) {
          dataobj.alertpointIndex = k;
          remainingDistance = 0;
          dataobj.alertmeter = remainingDistance;
          stopLoop = true;
          break;
        }
        dataobj.alertpointIndex = k + 1;
        dataobj.calculatedDistance -= remainingDistance;
        dataobj.alertmeter = remainingDistance;
        stopLoop = true;
        break;
      }
    }
  }
  dataobj.nearestPoint.latitude = legs[dataobj.alertlegIndex].steps[dataobj.alertstepIndex].end_location.lat;
  dataobj.nearestPoint.longitude = legs[dataobj.alertlegIndex].steps[dataobj.alertstepIndex].end_location.lng;
  return dataobj;
}
// decode polyline in map result and send as collection of geo position.
function decodePolyline(encoded, timePerMeter) {
  if (!encoded) {
    return [];
  }
  var poly = [];
  var index = 0;
  var len = encoded.length;
  var lat = 0;
  var lng = 0;
  while (index < len) {
    var b;
    var shift = 0;
    var result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result = result | ((b & 0x1f) << shift);
      shift += 5;
    } while (b >= 0x20);
    var dlat = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result = result | ((b & 0x1f) << shift);
      shift += 5;
    } while (b >= 0x20);
    var dlng = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    var p = {
      lat: lat / 1e5,
      lng: lng / 1e5,
      timePerMeter: timePerMeter
    };
    poly.push(p);
  }
  return poly;
}
module.exports = {
  /**
    * this methos is used to create realtion between driver and passenger and caretaker
    * @param {*} req
    * @param {*} res
    */
  start: async function (req, res) {
    if (!req.profile || req.profile.type !== 'driver') {
      return res.badRequest({ error: 'Driver not found' });
    }
    if (!req.body.latitude || !req.body.longitude || !req.body.type) {
      return res.badRequest({ error: 'Latitude or Longitude or type not found' });
    }
    if (!req.body && !req.body.vehicle) {
      return res.badRequest({ error: 'Vehicle id not found' });
    }
    if (req.body && req.body.route && (req.body.type === 'Pickup' || req.body.type === 'Drop')) {
      try {
        let stopType = 'dropStopping';
        if (req.body.type === 'Pickup') {
          stopType = 'pickupStopping';
        }
        const routeResult = await Route.getDatastore().sendNativeQuery(`
           select r.*, 
           (
             select array_to_json(array_agg(row_to_json("stopping")))
             from (
               select s.* from stopping s
               inner join routestopping rs on rs.route='${req.body.route}' and s.id = rs.stopping
             ) stopping
           ) stopping,
           (
             select array_to_json(array_agg(row_to_json("passenger")))
             from (
               select p.*, row_to_json(ss.*) as "${stopType}", 
               (
                 select array_to_json(array_agg(row_to_json("caretakers")))
                 from (
                   select c.*, row_to_json(p.*) as profile from caretaker c
                   inner join passengercaretaker pc on pc.passenger=p.id and c.id=pc.caretaker
                   inner join profile p on c.profile = p.id
                 ) caretakers
               ) caretakers
               from passenger p
               inner join passenger_route__route_passenger rp on rp.route_passenger='${req.body.route}' and p.id = rp.passenger_route
               inner join stopping ss on ss.id=p."${stopType}"
             ) passenger
           ) passenger
           from route r
           where r.id = '${req.body.route}';
         `);
        const route = routeResult.rows[0];
        if (!route) {
          return res.badRequest({ error: 'Route not found' });
        } else {
          const today = new Date();
          const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
          if (!req.query.startDate) {
            req.query.startDate = date + ' 00:00:00';
          }
          if (!req.query.endDate) {
            req.query.endDate = date + ' 23:59:59';
          }
          Activity.find({ route: route.id, endTime: null }).where({
            and: [{
              endTime: null
            }, {
              route: route.id
            }, {
              createdAt: {
                '>=': req.query.startDate
              }
            }, {
              createdAt: {
                '<=': req.query.endDate
              }
            }]
          }).populate('driver').exec((err, activity) => {
            if (err) { return res.badRequest({ error: 'Error on getting activity.' }); }
            if (activity && activity.length) {
              return res.badRequest({ error: 'This Route is already started journey by this Driver "' + activity[0].driver.name + '"' });
            }
            const passengerIds = _.pluck(route.passenger, 'id');
            const stoppingIds = _.pluck(route.stopping, 'id');
            if (route.passenger && route.passenger.length <= 0) {
              return res.badRequest({ error: 'Passenger is not assigned' });
            }
            if (route.stopping && route.stopping.length <= 0) {
              return res.badRequest({ error: 'Stopping is not assigned' });
            }
            _.map(route.stopping, (stop) => {
              stop.order = (route.extraData && route.extraData.orders) ? route.extraData.orders[stop.id] : 0;
              return stop;
            });
            _.map(route.passenger, (pass) => {
              if (pass[stopType]) {
                pass[stopType].order = (route.extraData && route.extraData.orders) ? route.extraData.orders[pass[stopType].id] : 0;
              }
              return pass;
            });
            // async.each(route.passenger, (passenger, callback) => {
            //   // you can populate many elements or only one...
            //   var populatePassenger = {
            //     caretaker: function (cb) {
            //       if (passenger[stopType]) {
            //         Passengercaretaker.find({ passenger: passenger.id }).populate('caretaker').exec((err, result) => {
            //           return cb(err, result);
            //         });
            //       } else {
            //         return cb(null, null);
            //       }
            //     }
            //   };
            //   async.parallel(populatePassenger, (err, resultSet) => {
            //     if (err) { return res.badRequest(err); }
            //     if (passenger[stopType]) {
            //       passenger.caretaker = resultSet.caretaker;
            //     }
            //     // finish
            //     callback();
            //   });
            // }, (err) => {// final callback
            //   if (err) { return res.badRequest(err); }
            if (!route.startPoint.latitude || !route.startPoint.longitude || !route.endPoint.latitude || !route.endPoint.longitude) {
              return res.badRequest({ error: 'Origin or Destination of route not found' });
            }
            let origin = JSON.stringify(req.body.latitude) + ',' + JSON.stringify(req.body.longitude);
            let destination = JSON.stringify(route.endPoint.latitude) + ',' + JSON.stringify(route.endPoint.longitude);
            let wayPoint = '';
            let wayPointStart = origin;
            let wayPointEnd = destination;
            let wayPoints = [];
            let spitCount = sails.config.custom.wayPoinCount; // 25
            let count = 0;
            route.stopping = _.sortBy(route.stopping, 'order');
            _.forEach(route.stopping, (stopping) => {
              count++;
              if ((count % (spitCount + 1)) === 0) {
                if (wayPoint !== '') {
                  wayPointEnd = JSON.stringify(stopping.address.latitude) + ',' + JSON.stringify(stopping.address.longitude);
                  wayPoints.push({ wayPoint, wayPointStart, wayPointEnd });
                  wayPointStart = wayPointEnd;
                  wayPointEnd = destination;
                }
                wayPoint = '';
              } else {
                if (wayPoint !== '') {
                  wayPoint = wayPoint + '|';
                }
                wayPoint = wayPoint + JSON.stringify(stopping.address.latitude) + ',' + JSON.stringify(stopping.address.longitude);
              }
              if (route.stopping.length === count) {
                wayPoints.push({ wayPoint, wayPointStart, wayPointEnd });
              }
            });
            let notifiyUser = [];
            let mapDatas = [];
            if (!wayPoints) {
              return res.badRequest({ error: 'Waypoints is not found' });
            }
            async.each(wayPoints, (wayPoint, callback) => {
              let url = `${sails.config.custom.directionAPIUrl}origin=${wayPoint.wayPointStart}&destination=${wayPoint.wayPointEnd}&key=${sails.config.custom.googleAPIKey}&waypoints=${wayPoint.wayPoint}&departure_time=now`;
              request(url, (err, result, body) => {
                if (err) { return callback(err); }
                if (result && result.request && result.request.uri && result.request.uri.query) {
                  const parsed = queryString.parse(result.request.uri.query);
                  mapDatas.push({
                    start: parsed.origin,
                    end: parsed.destination,
                    waypoint: parsed.waypoints,
                    body
                  });
                } else {
                  return callback({ error: 'Query not found' });
                }
                callback();
              });
            }, (err) => {
              if (err) { return res.badRequest(err); }
              let mapData = '';
              let orderedData = [];
              if (mapDatas.length > 1) {
                _.forEach(mapDatas, (mData) => {
                  const index = _.findIndex(wayPoints, { wayPointStart: mData.start, wayPointEnd: mData.end, wayPoint: mData.waypoint });
                  if (index > -1) {
                    orderedData[index] = mData;
                  }
                });
              } else if (mapDatas.length === 1) {
                orderedData = mapDatas;
              }
              _.forEach(orderedData, (ordereddata) => {
                if (!mapData) {
                  mapData = JSON.parse(ordereddata.body);
                  if (!mapData || (mapData && mapData.status !== 'OK')) {
                    return res.badRequest({ error: 'Something wrong when getting map data.', data: mapData });
                  }
                } else {
                  let mapResult = JSON.parse(ordereddata.body);
                  if (!mapData || (mapData && mapData.status !== 'OK')) {
                    return res.badRequest({ error: 'Something wrong when getting map data.', data: mapData });
                  }
                  mapData.routes[0].legs.push(...mapResult.routes[0].legs);
                  mapData.routes[0].overview_polyline.points += mapResult.routes[0].overview_polyline.points;
                }
              });
              const routeStopping = _.filter(route.stopping, { type: 'stop' });
              const stoppingLocation = [];
              if (mapData) {
                let points = [];
                let pointCount = 0;
                if (!mapData.routes || !mapData.routes.length) {
                  return res.end({ error: 'Route not found' });
                }
                _.forEach(mapData.routes[0].legs, (leg, legIndex) => {
                  let timePerMeter = Math.abs(leg.duration.value / leg.distance.value);
                  _.forEach(leg.steps, (step) => {
                    let pointsData = decodePolyline(step.polyline.points, timePerMeter);
                    if (pointsData.length) {
                      /*eslint camelcase: 0 */
                      step.start_point_index = pointCount;
                      pointCount = pointCount + pointsData.length;
                      step.end_point_index = pointCount - 1;
                      points.push(...pointsData);
                    } else {
                      step.start_point_index = pointCount - 1;
                      step.end_point_index = pointCount - 1;
                    }
                  });
                  const index = _.findIndex(routeStopping, { order: legIndex });
                  if (index > -1) {
                    stoppingLocation.push({
                      name: routeStopping[index].name,
                      latitude: points[leg.steps[0].start_point_index].lat,
                      longitude: points[leg.steps[0].start_point_index].lng,
                      index: leg.steps[0].start_point_index
                    });
                  }
                });
                _.forEach(route.passenger, (passenger) => {
                  if (passenger.caretakers && passenger[stopType]) {
                    _.forEach(passenger.caretakers, (caretaker) => {
                      const notifyTime = (passenger.extraData && passenger.extraData.notificationDetails &&
                         passenger.extraData.notificationDetails[caretaker.id]) ? passenger.extraData.notificationDetails[caretaker.id].notifyTime : 0;
                      let notifyUserDetail = findNotificationLocation(mapData, passenger[stopType].address.latitude,
                         passenger[stopType].address.longitude, passenger[stopType].order, (notifyTime * 60), points);
                      notifyUserDetail.deviceDetail = passenger.caretakers[0].profile.deviceDetail;
                      let passengerStopAddress = passenger[stopType].name ? passenger[stopType].name + ', ' : '';
                      if (passenger[stopType] && passenger[stopType].address) {
                        passengerStopAddress += passenger[stopType].address.streetLine1;
                        if (passenger[stopType].address.streetLine2) {
                          passengerStopAddress += ', ' + passenger[stopType].address.streetLine2;
                        }
                        if (passenger[stopType].address.city) {
                          passengerStopAddress += ', ' + passenger[stopType].address.city;
                        }
                        // if (passenger[stopType].address.state) {
                        //     passengerStopAddress += ', ' + passenger[stopType].address.state;
                        // }
                        // if (passenger[stopType].address.country) {
                        //     passengerStopAddress += ', ' + passenger[stopType].address.country;
                        // }
                      }
                      notifyUserDetail.address = passengerStopAddress;
                      notifyUserDetail.name = passenger.name || '';
                      notifyUserDetail.id = passenger.id;
                      notifiyUser.push(notifyUserDetail);
                    });
                  }
                });
                let activityData = {
                  startTime: new Date().toLocaleTimeString('en-US'),
                  passenger: passengerIds,
                  stopping: stoppingIds,
                  branch: route.branch,
                  // vehicle: relation.vehicle,
                  route: route.id,
                  driver: req.profile.id,
                  mapDetail: {
                    stoppings: stoppingLocation,
                    mapData: mapData,
                    currentPointIndex: 0,
                    isReachedStartPoint: false,
                    isReachedEndPoint: false,
                    points: points
                  },
                  notificationDetail: {
                    notifiyUser: notifiyUser
                  }
                };
                Activity.create(activityData).fetch()
                   .exec((err, activity) => {
                     if (err) { return res.badRequest(err); }
                     Vehicle.findOne({ id: req.body.vehicle }).exec((err, vehicle) => {
                      if(err) { return res.badRequest(err);}
                      if (!!vehicle.device) {
                        DeviceDetails.findOne({deviceId: vehicle.device}).exec((err, device) => {
                          if(err) { return res.badRequest(err);}
                            let deviceData = {
                              activity: activity.id,
                              latitude: req.body.latitude,
                              longitude: req.body.longitude
                            };
                            DeviceDetails.updateOne({id: device.deviceId}).set({deviceData});
                          });
                      }
                     });
                     return res.json(activity);
                   });
              } else {
                return res.badRequest({ error: 'Map data not found' });
              }
            });
          });
        }
      } catch (err) {
        return res.badRequest(err);
      }
    } else {
      return res.badRequest({ error: 'Route not found' });
    }
    // res.send('start realtion')
  },
  /**
     * @param {*} req
     * @param {*} res
     * this method is called when the driver hit the end for the route
     */
  end: async function (req, res) {
    if (req.body && req.body.activity) {
      var fetchRelationActivity = await Activity.findOne({ id: req.body.activity });
      if (!fetchRelationActivity) {
        return res.badRequest({ error: 'Relation-Activity not found' });
      }
      var updatedObject;
      var mapDetail = fetchRelationActivity.mapDetail;
      mapDetail.endpoint = {
        latitude: req.body.latitude,
        longitude: req.body.longitude
      };
      updatedObject = {
        endTime: new Date().toLocaleTimeString('en-US'),
        mapDetail: mapDetail
      };
      var updateRelationActivity = await Activity.updateOne({ id: fetchRelationActivity.id }).set(updatedObject);
      if (!updateRelationActivity) {
        res.badRequest({ error: 'Activity not found' });
      }
      res.send(updateRelationActivity);
    } else {
      res.badRequest({ error: 'Problem in end' });
    }
  },
  driverRoute: async function (req, res) {
    if (!req.profile || req.profile.type !== 'driver') {
      return res.badRequest({ error: 'Driver not found' });
    }
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    if (!req.query.startDate) {
      req.query.startDate = date + ' 00:00:00';
    }
    if (!req.query.endDate) {
      req.query.endDate = date + ' 23:59:59';
    }
    Activity.find({
      where: {
        and: [{
          driver: req.profile.id
        }, {
          endTime: null
        }, {
          createdAt: {
            '>=': req.query.startDate
          }
        }, {
          createdAt: {
            '<=': req.query.endDate
          }
        }]
      },
      skip: 0,
      limit: 1,
      sort: 'createdAt DESC'
    }).exec((err, activity) => {
      if (err) { return res.badRequest(err); }
      return res.ok(activity.length ? activity[0] : {});
    });
  }
};
