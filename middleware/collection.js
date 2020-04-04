const {getIsHideCollection} = require('./utils');
const {getCollectionPermission, getHideFields, getQueryCondition} = require('./utils');

module.exports = cms => {
  return async function getCollectionMiddleware({session, collections}, next) {
    let user = await cms.getModel('User').findById(session.userId);
    if (!user) {
      const role = await cms.getModel('Role').findOne({name: 'nouser'});
      if (role) user = {role};
    }
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
        if (queryConditions || user.role.name === 'admin') {
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
