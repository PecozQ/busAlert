/**
 * CommonController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

module.exports = {
  mediaUpload: async function (req, res) {
    var uploadFile = req.file('file');
    uploadFile.upload({ dirname: require('path').resolve(sails.config.appPath, 'assets/import/student') }, function onUploadComplete(err, files) {
      // Files will be uploaded to api/assetd/images
      if (err) {
        return res.serverError(err);  // IF ERROR Return and send 500 error with error
      }
      var baseUrl = sails.config.custom.baseUrl;
      _.map(files, (file) => {
        file['path'] = require('util').format('%s/import/student/%s', baseUrl, file.fd.split('/')[file.fd.split('/').length - 1]);
      });
      return res.json({
        status: 200,
        file: files
      });
    });
  },
  bulkInsert: async function (req, res) {
    try {
      if (!req.body.type || !req.body.data || !req.body.data.length) {
        res.badRequest({ error: 'Type or data not found.' });
      }
      req.options.model = req.body.type;
      var Model = actionUtil.parseModel(req);
      const createdData = await Model.createEach(req.body.data).fetch();
      return res.ok(createdData);
    } catch (err) {
      return res.serverError(err);
    }
  }
};
