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
  if (/^create/.test(method.fn) || /Update|Replace/.test(method.fn) || /remove|delete|Remove|Delete/.test(method.fn)) {
    method.args[0] = { ...method.args[0], ...queryCondition.create };
  } else {
    method.args[0] = { ...method.args[0], ...queryCondition.find };
  }
  return method;
}

module.exports = cms => {
  return function interfaceMiddleware({ name, chain, socket }, next) {
    const permission = getCollectionPermission(socket.request.user, name);
    if (!permission) {
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
    const queryCondition = getQueryCondition(socket.request.user, name);
    chain[0] = addQueryCondition(model, chain[0], queryCondition);
    const hideField = getHideFields(socket.request.user, name);
    if (Array.isArray(hideField)) {
      chain.push({ fn: 'select', args: [hideField.map(i => `-${i}`).join(' ')] }); // ['a','b'] => '-a -b'
    }
    next(null, { model, chain });
  };
};
