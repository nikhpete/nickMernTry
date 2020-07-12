const express = require('express');
const router = express.Router();
const gravtar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Input a valid Email').isEmail(),
    check('password', 'Minimum password length is 6').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;

    try {
      console.log('Check User Exists');
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User Exists' }] });
      }

      console.log('get users gravtar');
      const avatar = gravtar.url(email, { s: '200', r: 'pg', d: 'mm' });
      user = new User({ name, email, avatar, password });

      console.log('encrypt pswd');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      console.log('save');
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          console.log('jwt token');
          res.json({ token });
        }
      );
    } catch (err) {
      console.err(err.message);
      res.status(500).send('Internal Server Error');
    }
  }
);

module.exports = router;
