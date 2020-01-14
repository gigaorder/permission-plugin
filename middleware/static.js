const jwt = require('jsonwebtoken');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';

module.exports = cms => function staticMiddleware(req, res, next) {
  jwt.verify(req.cookies && req.cookies.token, secretKey, (err, user) => {
    if (err) {
      res.send('Not allowed');
    } else {
      next();
    }
  });
};
