const jsonfn = require('json-fn');
const _ = require('lodash');

function getCollectionPermission(user, collection) {
  if (!user.role) {
    return;
  }
  if (user.role.name === 'admin') {
    // special role
    return 'all';
  }
  const { collectionPermission } = user.role;
  if (!Array.isArray(collectionPermission)) {
    return null;
  }
  const permission = collectionPermission.find(item => item.collectionName === collection);
  if (permission) {
    return permission.permission;
  }
}

function getQueryCondition(user, collection) {
  if (!user.role) {
    return;
  }
  if (user.role.name === 'admin') {
    return;
  }
  const { collectionPermission } = user.role;
  if (!Array.isArray(collectionPermission)) {
    return null;
  }
  const permission = collectionPermission.find(item => item.collectionName === collection);
  if (permission) {
    let queryCondition = jsonfn.clone(permission.queryCondition, true, true);
    if (typeof queryCondition === 'function') {
      return queryCondition(user);
    }
    return queryCondition;
  }
}

function getHideFields(user, collection) {
  if (!user.role) {
    return [];
  }
  if (user.role.name === 'admin') {
    return [];
  }
  const { collectionPermission } = user.role;
  if (!Array.isArray(collectionPermission)) {
    return null;
  }
  const permission = collectionPermission.find(item => item.collectionName === collection);
  if (permission) {
    return permission.hideFields;
  }
}

module.exports = {
  getHideFields,
  getCollectionPermission,
  getQueryCondition
};
