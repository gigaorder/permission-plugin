const jwt = require('jsonwebtoken');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';
const _ = require('lodash');

module.exports = cms => {
  function socketVerifyService(socket, next) {
    if (socket.nsp.name === '/file-manager-app') {
      return next();
    }
    let token = socket.handshake.query.token;
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return next({ data: { to: '/login', message: err.message } });
      }
      const User = cms.getModel('User');
      if (_.isEmpty(User)) {
        return next();
      }
      User.findOne({ username: user.username })
        .then(_u => {
          if (_u) {
            socket.request.user = user;
            next();
          } else {
            socket.disconnect();
            next({ data: { to: '/login', message: 'invalid token' } });
          }
        })
        .catch(err => {
          socket.disconnect();
          next({ data: { to: '/login', message: 'internal_error' } });
        });
    });
  }

  return socketVerifyService;
};
