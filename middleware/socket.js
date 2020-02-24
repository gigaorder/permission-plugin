const jwt = require('jsonwebtoken');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';
const _ = require('lodash');

module.exports = cms => {
  function socketVerifyService(socket, next) {
    if (socket.nsp.name === '/file-manager-app') {
      return next();
    }
    const referer = socket.request.headers.referer
    /*if (referer && referer.endsWith(cms.data['loginUrl'])) {
      return next();
    }*/
    /*if (referer && cms.data['nonAuthenticateUrls'] && cms.data['nonAuthenticateUrls'].find(url => _.includes(referer, url))) {
      return next();
    }*/

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
            next({data: {to: '/login', message: 'invalid token'}});
          }
        })
        .catch(err => {
          socket.disconnect();
          next({data: {to: '/login', message: 'internal_error'}});
        });
    });
  }

  return socketVerifyService;
};
