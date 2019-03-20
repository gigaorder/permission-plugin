const jwt = require('jsonwebtoken');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';

module.exports = cms => {
  function socketVerifyService(socket, next) {
    let token = socket.handshake.cookies.token;
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
            next({ data: { to: '/login', message: 'invalid token' } });
          }
        })
        .catch(err => {
          next({ data: { to: '/login', message: 'internal_error' } });
        });
    });
  }

  return socketVerifyService;
};
