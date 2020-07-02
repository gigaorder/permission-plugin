const { getCollectionPermission, getHideFields, getQueryCondition } = require('./utils');

const jsonfn = require('json-fn');
const _ = require('lodash');

const readAllowMethod = ['find', 'findOne', 'findById', 'skip', 'limit', 'count', 'countDocuments', 'estimatedDocumentCount', 'select'];

// const findMethod = ['find', 'findById', 'findOne', '']

function addQueryCondition(model, method, queryCondition) {
  // console.log(queryCondition);
  if (!queryCondition) {
    return method;
  }
  // console.log(queryCondition);
  queryCondition = jsonfn.clone(queryCondition, true, true);
  if (typeof method.args[0] !== 'object') {
    // find by id, cannot add query condition
    return method;
  }
  if ((/^create/.test(method.fn) || /Update|Replace/.test(method.fn) || /remove|delete|Remove|Delete/.test(method.fn))) {
    if (queryCondition.create) {
      if (Array.isArray(method.args[0])) {
        for (let doc of method.args[0]) {
          Object.assign(doc, queryCondition.create);
        }
      } else {
        method.args[0] = { ...method.args[0], ...queryCondition.create };
      }
    }
  } else {
    // console.log(`add role.find query for ${method.fn}`)
    const args0Keys = _.keys(method.args[0])
    const queryConditionFindKeys = _.keys(queryCondition.find)
    if (_.intersection(args0Keys, queryConditionFindKeys).length > 0) {
      method.args[0] = { $and: [ method.args[0], queryCondition.find ]}
    } else {
      method.args[0] = { ...method.args[0], ...queryCondition.find };
    }
  }
  return method;
}

module.exports = cms => {
  return async function interfaceMiddleware({ name, chain, socket }, next) {
    let user = socket.handshake.session.user || socket.request.user;
    if (!user) {
      const role = await cms.getModel('Role').findOne({name: 'nouser'});
      if (role) user = {role};
    }
    const permission = getCollectionPermission(user, name);
    if (!permission) {
      console.warn(`collection ${name} is not allowed`);
      return next('not allow');
    }
    if (permission === 'read') {
      const allChainMethod = chain.map(item => item.fn);
      const isAllow = allChainMethod.every(item => readAllowMethod.includes(item));
      if (!isAllow) {
        return next('not allow');
      }
    }
    let model = cms.getModel(name);
    const queryCondition = await getQueryCondition(user, name);
    chain[0] = addQueryCondition(model, chain[0], queryCondition);
    const hideField = getHideFields(user, name);
    if (Array.isArray(hideField) && hideField.length > 0 && !['create', 'createCollection', 'aggregate'].includes(chain[0].fn)) {
      chain.push({ fn: 'select', args: [hideField.map(i => `-${i}`).join(' ')] }); // ['a','b'] => '-a -b'
    }
    next(null, { model, chain });
  };
};
