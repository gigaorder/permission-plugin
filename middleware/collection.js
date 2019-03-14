const _ = require('lodash');
const jsonfn = require('json-fn');

function getCollectionPermission(user, collection) {
  if (user.role === 'admin') {
    // special role
    return 'all';
  }
  const { collectionPermission } = user;
  if (!Array.isArray(collectionPermission)) {
    return null;
  }
  const permission = collectionPermission.find(item => item.collectionName === collection);
  if (permission) {
    return permission.permission;
  }
}

function getQueryCondition(user, collection) {
  if (user.role === 'admin') {
    return;
  }
  const { collectionPermission } = user;
  if (!Array.isArray(collectionPermission)) {
    return null;
  }
  const permission = collectionPermission.find(item => item.collectionName === collection);

  if (permission) {
    let queryCondition = jsonfn.clone(permission.queryCondition, true, true);
    queryCondition = _.omit(queryCondition, ['_code_', '_code_type_']);
    return queryCondition;
  }
}

function getHideFields(user, collection) {
  if (user.role === 'admin') {
    return [];
  }
  const { collectionPermission } = user;
  if (!Array.isArray(collectionPermission)) {
    return null;
  }
  const permission = collectionPermission.find(item => item.collectionName === collection);
  if (permission) {
    return permission.hideFields;
  }
}

module.exports = cms => {
  return async function getCollectionMiddleware({ name, socket, collection }, next) {
    const permission = getCollectionPermission(socket.request.user, name);
    const queryConditions = getQueryCondition(socket.request.user, name);
    if (!permission) {
      return next('error');
    }
    if (collection.info.alwaysLoad) {
      const list = await cms.getModel(name).find(queryConditions || {});
      collection.list.push(...list);
    }
    const hideField = getHideFields(socket.request.user, name);
    // Remove hide field from form
    collection.form = collection.form.filter(item => !hideField.includes(item.key));
    next(null, { collection });
  };
};
