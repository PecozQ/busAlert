/**
* Module dependencies
*/

var _ = require('lodash');
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

var takeAlias = _.partial(_.map, _, 'alias');
var populateAlias = function (model, alias) {
  return model.populate(alias);
};

/**
* Find Records
*
* http://sailsjs.com/docs/reference/blueprint-api/find
*
* An API call to find and return model instances from the data adapter
* using the specified criteria. If an id was specified, just the instance
* with that unique id will be returned.
*
*/

module.exports = function findRecords(req, res) {
  _.set(req.options, 'criteria.blacklist', ['fields', 'populate', 'limit', 'skip', 'page', 'sort']);

  var fields = req.param('fields') ? req.param('fields').replace(/ /g, '').split(',') : [];
  var populate = req.param('populate') ? req.param('populate').replace(/ /g, '').split(',') : [];
  var Model = actionUtil.parseModel(req);
  var where = actionUtil.parseCriteria(req);
  var limit = actionUtil.parseLimit(req);
  var skip = req.param('page') * limit || actionUtil.parseSkip(req);
  var sort = actionUtil.parseSort(req);
  var query = Model.find(fields.length > 0 ? { select: fields } : null).where(where).limit(limit).skip(skip).sort(sort);
  var findQuery = _.reduce(_.intersection(populate, takeAlias(Model.associations)), populateAlias, query);

  Model.count(where).exec((error, count) => {

    if (error) {
      return res.serverError(error);
    }

    var metaInfo = {
      start: skip,
      end: skip + limit,
      limit: limit,
      total: count,
      criteria: where,
      page: Math.floor(skip / limit)
    };
    res.set('content-count', metaInfo.total);
    findQuery
      .then((records) => {
        return [records, {
          root: metaInfo
        }];
      })
      .spread(res.ok)
      .catch(res.negotiate);
  });

};
