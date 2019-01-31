const argv = require("minimist")(process.argv.slice(2));
const stripFields = require("./../utils/strip-fields");
const getFile = require("../utils/get-file");
const isEmpty = require("../utils/empty-file");

module.exports = update;

/**
 * Updates app, widget and bucket via HTTP endpoint
 * based on configuration file
 *
 * @param  {function} api api client
 * @param  {object} config configuration file's data
 * @param  {string} region region to filter the configuration file
 */
function update(api, config, region, defaults) {
  const hasWidgetId =
    config[region].widget_json && config[region].widget_json.id;
  if (!hasWidgetId) {
    this.logger.error("Please run setup first - widget has no ID");
    process.exit(1);
  }

  const schema = getFile(defaults.schemaPath);

  if (schema && !isEmpty(schema)) {
    config[region].widget_json.schema = schema.schema;
  }

  let app = config[region].app_json;
  let widget = config[region].widget_json;

  return Promise.resolve()
    .then(() => updateApp(this.logger, api, app))
    .then(settings =>
      updateWidget(this.logger, api, settings, widget, defaults)
    )
    .then(settings => updateBucket(this.logger, api, settings))
    .then(() => (argv.f || argv.force) && this.onForce())
    .catch(err => {
      this.logger.error(`Unable to update widget: ${JSON.stringify(err)}`);
      process.exit(1);
    });
}

function updateApp(logger, api, app) {
  return new Promise((resolve, reject) => {
    const { id, origin } = app;
    delete app.id;
    delete app.origin;

    return api(`/api/apps/${id}`, app, "patch")
      .then(res => {
        logger.debug(res);
        logger.info("App patched successfully");

        app.id = id;
        app.origin = origin;

        resolve({ app: stripFields(res) });
      })
      .catch(err => reject(err));
  });
}

function updateWidget(logger, api, settings, widget, defaults) {
  return new Promise((resolve, reject) => {
    const id = widget.id;

    // widget id should not be passed into the payload
    // due to error key 'id' is invalid to update
    delete widget.id;
    delete widget.app_id;

    widget = Object.assign(defaults.widget, widget, {
      type: "marketplace",
      // the bucket was created with using the widget's id as name
      source: `/cmp/api/storage/buckets/${id}/${defaults.entry}`
    });

    logger.debug(`Uploading widget with following configuration: ${widget}`);
    return api(`/api/apps/widgets/${id}`, widget, "put")
      .then(res => {
        logger.debug(res);
        logger.info("Widget config updated successfully");
        widget.id = id;
        resolve({
          app: settings.app_json,
          widget: widget
        });
      })
      .catch(err => reject(err));
  });
}

function updateBucket(logger, api, settings) {
  const id = settings.widget.id;
  return deleteBucket(logger, api, id)
    .then(() => createBucket(logger, api, settings, id))
    .then(() => createBucketEntry(logger, api, settings, id))
    .then(() => api(`/api/storage/archive/${id}`, false, "put", "x-tgz"))
    .catch(err => reject(err));
}

function deleteBucket(logger, api, id) {
  return new Promise((resolve, reject) => {
    api(`/api/storage/buckets/${id}?force=true`, false, "delete")
      .then(() => {
        logger.info("Deleted bucket");
        resolve();
      })
      .catch(err => reject(err));
  });
}

function createBucket(logger, api, settings, id) {
  const bucket = {
    type: "shared",
    acl: [
      {
        customer_id: "00000000-0000-0000-0000-000000000000",
        permission: "ro"
      }
    ]
  };

  return new Promise((resolve, reject) => {
    api(`/api/storage/buckets/${id}`, bucket, "put")
      .then(res => {
        logger.info("Created bucket");
        logger.debug(res);
        resolve({
          app: settings.app,
          widget: settings.widget
        });
      })
      .catch(err => reject(err));
  });
}
function createBucketEntry(logger, api, settings, id) {
  const bucket = {
    type: "public"
  };

  return new Promise((resolve, reject) => {
    api(`/api/storage/buckets/${id}/entry`, bucket, "put")
      .then(res => {
        logger.info("Created bucket entry");
        logger.debug(res);
        resolve({
          app: settings.app,
          widget: settings.widget
        });
      })
      .catch(err => reject(err));
  });
}
