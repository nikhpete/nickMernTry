const jwt = require('jsonwebtoken');
const config = require('config');

// function access to req n res
// next is callback to move to the next
module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header('x-auth-token');

  //check if not token
  if (!token) {
    return res.status(401).json({ msg: 'You have no authority' });
  }

  //verify token
  try {
    const decode = jwt.verify(token, config.get('jwtSecret'));

    req.user = decode.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Not a valid Token' });
  }
};
