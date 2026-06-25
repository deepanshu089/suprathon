// Auth Routes — registration and login (public, no auth required)
const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

router.post("/signup", signup); // create a new account (candidate or recruiter)
router.post("/login", login); // exchange username/password for a JWT

module.exports = router;
