require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model('User');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post("/signup", async (req, res) => {
  console.log("JESUIS LA",req.body);
  const emailRegexp = /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
  const passwordRegexp = /^.{8,}$/;
  const { email, password } = req.body;
  

//   const email = req.body.email;
//   const password = req.body.password;

  if (!emailRegexp.test(email) || !passwordRegexp.test(password)) {
    return res.status(422).send({ error: "erreur inscription" });
  } else {
    try {
      const user = new User({
        email,
        password,
      });
      await user.save();

      const token = jwt.sign({ userId: user._id }, "MY_SECRET_KEY");
      res.status(200).send({token});
    } catch (err) {
      return res.status(422).send(err.message);
    }
  }
});
module.exports = router;
