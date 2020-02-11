const {getIsHideCollection} = require('./utils');
const {getCollectionPermission, getHideFields, getQueryCondition} = require('./utils');

module.exports = cms => {
  return async function getCollectionMiddleware({session, collections}, next) {
    const user = await cms.getModel('User').findById(session.userId).lean();
    for (let collectionName in collections) {
      if (['ComponentBuilder', 'PluginFile'].includes(collectionName)) {
        collections[collectionName].list = await cms.getModel(collectionName).find({});
        continue;
      }
      const collection = collections[collectionName];
      const permission = getCollectionPermission(user, collectionName);
      if (!permission) {
        delete collections[collectionName];
        continue;
      }
      if (collection.info.alwaysLoad) {
        const queryConditions = await getQueryCondition(user, collectionName);
        if (queryConditions) {
          // collection.list = [];
          const list = await cms.getModel(collectionName).find(queryConditions && queryConditions.find || {});
          collection.list = list;
        }
      }
      const hideField = getHideFields(user, collectionName);
      // Remove hide field from form
      if (Array.isArray(hideField)) {
        collection.form = collection.form.filter(item => !hideField.includes(item.key));
      }
    }
    next(null, {collections});

  };
};
