const jwt = require('jsonwebtoken');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';
const url = require('url');
const _ = require('lodash');

module.exports = cms => {
  function socketVerifyService(socket, next) {
    if (socket.nsp.name === '/file-manager-app') {
      return next();
    }
    const referer = socket.request.headers.referer
    if (referer) {
      const urlParts = url.parse(referer)
      if (urlParts.pathname === cms.data['loginUrl']) {
        if (!socket.handshake.query.token)
          return next();
      }
      // using startsWith instead of === because referer path may be "path+params"
      // e.g: /store/gigashop where as /store is path and gigashop is route params
      if (cms.data['nonAuthenticateUrls'] && cms.data['nonAuthenticateUrls'].find(path => _.startsWith(urlParts.pathname, path))) {
        return next();
      }
    }

    let token = socket.handshake.query.token;
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return next({data: {to: cms.data['loginUrl'] || '/login', message: err.message}});
      }
      const User = cms.getModel('User');
      if (_.isEmpty(User)) {
        return next();
      }
      User.findOne({_id: user._id})
        .then(_user => {
          if (_user) {
            socket.request.user = _.omit(_user.toObject(), ['password']);
            for (const {from, to} of (_user.role.mappingUrls || [])) {
              if (from === _.get(socket, 'request.headers.referer', '').split(_.get(socket, 'request.headers.host'))[1]) {
                return next({data: {to}});
              }
            }
            next();
          } else {
            socket.disconnect();
            next({data: {to: cms.data['loginUrl'] || '/login', message: 'invalid token'}});
          }
        })
        .catch(err => {
          socket.disconnect();
          next({data: {to: cms.data['loginUrl'] || '/login', message: 'internal_error'}});
        });
    });
  }

  return socketVerifyService;
};
