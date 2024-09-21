const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { JwtService, CustomErrorHandler } = require("../services");
const { UserDetail } = require("../models");
const { APP_URL, APP_PORT, F_APP_URL, API_KEY } = require("../config");
const { sendEmail } = require("../services");
const { Token } = require("../models");

// ================= Email Verification Link Sent ================
router.post("/send-verification-link/:id/", async (req, res) => {
  try {
    // Check if the provided ID is in a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const user = await UserDetail.findOne({ _id: req.params.id });

    if (user) {
      if (user.email_verification === false) {
        const verificationToken = new Token({
          userId: user._id,
          token: JwtService.sign({ userId: user._id }, "1h", API_KEY),
        });
        verificationToken.save().then((token) => {
          const verificationLink = `${APP_URL}:${APP_PORT}/${user._id}/verify/${token.token}`;

          // Send verification email
          const subject = "Email Verification";
          const text = `Click the following link to verify your email: ${verificationLink}`;
          sendEmail(user.email, subject, text);
          res.status(200).json({ message: "Verification Link Sent" });
        });
      } else {
        res.status(400).json({ message: "Email already verified" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.all("/send-verification-link/:id/", () => {
  throw CustomErrorHandler.badRequest();
});

// ================= Email Verification Processing =================
router.get("/:id/verify/:token/", async (req, res) => {
  try {
    const user = await UserDetail.findOne({ _id: req.params.id });
    if (!user)
      return res.status(400).send({ message: "Invalid link -- user issue" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token)
      return res.status(400).send({ message: "Invalid link -- token issue" });
    await UserDetail.updateOne({ _id: user._id }, { email_verification: true });
    await token.remove();
    res.redirect(302, `${F_APP_URL}`);
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Invalid link -- internal server issue" });
  }
});
router.all("/:id/verify/:token/", () => {
  throw CustomErrorHandler.badRequest();
});

module.exports = router;
