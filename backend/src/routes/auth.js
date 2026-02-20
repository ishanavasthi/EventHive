const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, bankDetails, profilePicture } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
        bankDetails,
        profilePicture
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          // Return user without password
          const userResp = user.toObject();
          delete userResp.password;
          res.json({ token, user: userResp });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5d' },
        (err, token) => {
          if (err) throw err;
          const userResp = user.toObject();
          delete userResp.password;
          res.json({ token, user: userResp });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route POST /api/auth/google
// @desc Login with Google
// @access Public
router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "878257577448-jlb8ocmbha6jgublnlmp60fjl6haogjf.apps.googleusercontent.com",
    });

    const { name, email, picture } = ticket.getPayload();

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create New User
      user = new User({
        name,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        profilePicture: picture,
        isGoogleUser: true
      });
      await user.save();
    }

    // Return JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        const userResp = user.toObject();
        delete userResp.password;
        res.json({ token, user: userResp });
      }
    );
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(401).json({ msg: 'Google Token Verification Failed' });
  }
});

// @route PUT /api/auth/profile
// @desc Update user profile
// @access Private
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { email, profilePicture, bankDetails } = req.body;

    // Build update object
    const updateFields = {};
    if (email) updateFields.email = email;
    if (profilePicture) updateFields.profilePicture = profilePicture;
    if (bankDetails) updateFields.bankDetails = bankDetails;

    // Normalize bank details if provided
    if (bankDetails) {
      updateFields.bankDetails = {
        accountNumber: bankDetails.accountNumber || '',
        ifscCode: bankDetails.ifscCode || '',
        accountHolderName: bankDetails.accountHolderName || ''
      };
    }

    // Name is explicitly NOT updated here
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;