const { getCollectionPermission, getHideFields, getQueryCondition } = require('./utils');

module.exports = cms => {
  return async function getCollectionMiddleware({ name, socket, collection }, next) {
    const permission = getCollectionPermission(socket.request.user, name);
    const queryConditions = getQueryCondition(socket.request.user, name);
    if (!permission) {
      return next('error');
    }
    if (collection.info.alwaysLoad) {
      const list = await cms.getModel(name).find((queryConditions && queryConditions.find) ? queryConditions.find : {});
      collection.list.push(...list);
    }
    const hideField = getHideFields(socket.request.user, name);
    // Remove hide field from form
    if (Array.isArray(hideField)) {
      collection.form = collection.form.filter(item => !hideField.includes(item.key));
    }
    next(null, { collection });
  };
};
