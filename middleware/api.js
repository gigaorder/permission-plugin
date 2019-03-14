const jwt = require('jsonwebtoken');
const _ = require('lodash');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';

module.exports = (cms) => {
  cms.app.post('/authenticate', function (req, res) {
    const { username, password } = req.body;
    const model = cms.getModel('User');
    if (_.isEmpty(model)) {
      res.status(400).json({message: 'Not found collection'})
    }
    model.findOne({ username })
      .then(user => {
        if (user) {
          if (user.password === password) {
            const payload = _.pick(user.toObject(), ['username', '_id', 'collectionPermission', 'role', 'queryCondition']);
            const token = jwt.sign(payload, secretKey, { expiresIn: expireIn });
            res.cookie('token', token);
            res.status(200).json({ token });
          } else {
            res.status(400).json({ message: 'Password invalid' });
          }
        } else {
          res.status(400).json({ message: 'user is not exists' });
        }
      })
      .catch(err => {
        res.status(400).json({ message: 'internal error' });
      });
  });
};