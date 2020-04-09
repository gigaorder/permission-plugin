const jwt = require('jsonwebtoken');
const _ = require('lodash');
const expireIn = 60 * 60 * 24 * 7; // 7 days
const secretKey = 'eSdsL0AxK332GnqQbkWh';

module.exports = (cms) => {
  cms.app.post('/authenticate', function (req, res) {
    const {username, password} = req.body;
    const model = cms.getModel('User');
    if (_.isEmpty(model)) {
      res.status(400).json({message: 'Not found collection'});
    }
    model.findOne({username})
      .then(user => {
        if (user) {
          if (user.password === password) {
            const token = jwt.sign({_id: user._id}, secretKey, {expiresIn: expireIn});
            res.cookie('token', token, {domain: 'localhost:8080'});
            res.cookie('userId', user._id);
            req.session.token = token;
            req.session.userId = user._id
            req.session.userRole = user.role;
            req.session.user = _.omit(user.toJSON(), ['password']);
            res.status(200).json({token});
          } else {
            res.status(400).json({message: 'Password invalid'});
          }
        } else {
          res.status(400).json({message: 'user is not exists'});
        }
      })
      .catch(err => {
        res.status(400).json({message: 'internal error'});
      });
  });

  cms.app.get('/logout', function (req, res) {
    req.session.token = undefined;
    req.session.userId = undefined
    req.session.userRole = undefined
    res.send('ok')
  })
};
