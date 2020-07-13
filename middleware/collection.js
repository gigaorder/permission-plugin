const {getIsHideCollection} = require('./utils');
const {getCollectionPermission, getHideFields, getQueryCondition} = require('./utils');

module.exports = cms => {
  return async function getCollectionMiddleware({session, collections}, next) {
    let user = await cms.getModel('User').findById(session.userId);

    if (!user) {
      const role = await cms.getModel('Role').findOne({name: 'nouser'});
      if (role) user = {role};
    }

    await Promise.all(Object.keys(collections).map(async collectionName => {
      if (['ComponentBuilder', 'PluginFile'].includes(collectionName)) {
        collections[collectionName].list = await cms.getModel(collectionName).find({});
        return;
      }

      const permission = getCollectionPermission(user, collectionName);
      if (!permission) {
        delete collections[collectionName];
        return;
      }

      const collection = collections[collectionName];
      if (collection.info.alwaysLoad) {
          const queryConditions = await getQueryCondition(user, collectionName);
          if (queryConditions || user.role.name === 'admin') {
            collection.list = await cms.getModel(collectionName).find(queryConditions && queryConditions.find || {});
          }
      }

      // Remove hide field from form
      const hideField = getHideFields(user, collectionName);
      if (Array.isArray(hideField)) {
        collection.form = collection.form.filter(item => !hideField.includes(item.key));
      }
    }));

    next(null, {collections});
  };
};
