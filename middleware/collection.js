const { getIsHideCollection } = require('./utils');
const { getCollectionPermission, getHideFields, getQueryCondition } = require('./utils');

module.exports = cms => {
  return async function getCollectionMiddleware({ socket, collections }, next) {
    for (let collectionName in collections) {
      if (['ComponentBuilder', 'PluginFile'].includes(collectionName)) continue;
      const collection = collections[collectionName];
      const permission = getCollectionPermission(socket.request.user, collectionName);
      if (!permission) {
        delete collections[collectionName];
        continue;
      }
      if (collection.info.alwaysLoad) {
        const queryConditions = await getQueryCondition(socket.request.user, collectionName);
        if (queryConditions) {
          // collection.list = [];
          const list = await cms.getModel(collectionName).find(queryConditions && queryConditions.find || {});
          collection.list = list;
        }
      }
      const hideField = getHideFields(socket.request.user, collectionName);
      // Remove hide field from form
      if (Array.isArray(hideField)) {
        collection.form = collection.form.filter(item => !hideField.includes(item.key));
      }
    }
    next(null, { collections });

  };
};
