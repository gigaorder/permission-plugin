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
            req.session.user = _.omit(user, ['password']);
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

  /**
   * Generate access_token base on username, password
   */
  cms.utils = cms.utils || {}
  cms.utils.generateAccessToken = async (username, password) => {
    const user = await cms.getModel('User').findOne({username, password})
    if (user)
      return jwt.sign({ _id: user._id }, secretKey, { expiresIn: expireIn })
    else
      return null
  }

  /**
   * Authenticate by access_token
   */
  cms.app.post('/authenticate-with-access-token', async (req, res) => {
    const { access_token } = req.body
    jwt.verify(access_token, secretKey, (err, user) => {
      if (err) {
        res.status(400).json({message: 'internal error'});
        return
      }

      const User = cms.getModel('User');
      if (_.isEmpty(User)) {
        res.status(400).json({message: 'internal error'});
        return;
      }

      User.findOne({_id: user._id}).then(_user => {
        if (_user) {
          res.cookie('token', access_token, {domain: 'localhost:8080'});
          res.cookie('userId', _user._id);
          req.session.token = access_token;
          req.session.userId = _user._id
          req.session.userRole = _user.role;
          req.session.user = _.omit(_user, ['password']);
          res.status(200).json({access_token});
        } else {
          res.status(400).json({message: 'user is not exists'});
        }
      })
      .catch(err => {
        res.status(400).json({message: 'internal error'});
      });
    });
  })

  cms.app.post('/update-user-session', async (req, res) => {
    if (req.session.userId) {
      const user = await cms.getModel('User').findOne({ _id: req.session.userId });
      if (user) {
        req.session.user = user
        req.session.userRole = user.role
        res.status(200).json(user)
      }
    }
  })

  cms.app.get('/logout', function (req, res) {
    req.session.token = undefined;
    req.session.userId = undefined
    req.session.userRole = undefined
    req.session.user = undefined
    res.send('ok')
  })
};
