const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

//@access Public
//@route Post api/auth/login
//@desc Login user
router.post(
  "/login",
  [
    check("email", "Enter a valid email address").isEmail(),
    check("password", "Password is required").not().isEmpty(),
  ],
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials", param: "email" }] });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          errors: [{ msg: "Invalid Credentials", param: "password" }],
        });
      }
      const payload = { user: { id: user.id, name: user.name } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (e) {
      res.status(500).send("Server Error");
    }
  }
);

//@route Post api/auth/register
//@desc Register user
//@access Public
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Enter a valid email address").isEmail(),
    check("password", "Minimum length of the password must be 6").isLength({
      min: 6,
    }),
    check(
      "password2",
      "You must re-enter your password to verify that you entered it correctly the first time!"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, password2 } = req.body;
    if (password !== password2)
      return res.status(400).json({
        errors: [{ msg: "Passwords do not match!", param: "password2" }],
      });
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists", param: "email" }] });
      }
      user = new User({ name, email, password, date: Date.now() });
      let salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      const payload = { user: { id: user.id, name: user.name } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 36000000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (e) {
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
