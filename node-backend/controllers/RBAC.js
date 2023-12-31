const Artisan = require("../models/artisian")
const User = require("../models/user")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
// const translate = require("../utils/translate");

exports.artisianLogin = async (req, res) => {
  const { mobile, password } = req.body
  try {
    let artisan = await Artisan.findOne({ mobile })
    if (!artisan)
      return res.status(403).json({ message: "User does not exists" })
    const isMatch = await bcrypt.compare(password, artisan.password) // Here await is necessary
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" })
    const token = jwt.sign(
      {
        id: artisan._id,
      },
      process.env.JWT_SECRET
    )
    // console.log(artisan)
    // console.log(artisan._id.valueOf())
    res.cookie("accessToken", token)
    res.cookie("role", "artisan") // Sending role also in cookie. This is for frontend to know which role is logged in
    res.cookie("artisanId", artisan._id.valueOf())
    return res.status(200).json({
      message: "Login successful",
      accessToken: token,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

exports.userLogin = async (req, res) => {
  const { mobile, password } = req.body
  try {
    let user = await User.findOne({ mobile })
    if (!user) return res.status(403).json({ message: "User already exists" })
    const isMatch = bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(403).json({ message: "Invalid credentials" })
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET
    )
    // res.cookie.accessToken = token;
    res.cookie("accessToken", token)
    res.cookie("role", "user") // Sending role also in cookie. This is for frontend to know which role is logged in
    res.cookie("userId", user._id.valueOf())
    return res.status(200).json({
      message: "Login successful",
      accessToken: token,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

exports.artisianRegister = async (req, res) => {
  const { name, age, address, mobile, password } = req.body
  try {
    let artisan = await Artisan.findOne({ mobile })
    if (artisan) return res.status(403).json({ message: "User already exists" })
    // name = translate(name);
    // address = translate(address);
    artisan = new Artisan({
      name,
      age,
      address,
      mobile,
      password,
    })
    const salt = await bcrypt.genSalt(10)
    artisan.password = await bcrypt.hash(password, salt)
    await artisan.save()
    const token = jwt.sign(
      {
        id: artisan._id,
      },
      process.env.JWT_SECRET
    )
    // res.cookie.accessToken = token;
    res.cookie("accessToken", token)
    res.cookie("role", "artisan") // Sending role also in cookie. This is for frontend to know which role is logged in
    res.cookie("artisanId", artisan._id.valueOf())
    return res.status(200).json({
      message: "Registration successful",
      accessToken: token,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

exports.userRegister = async (req, res) => {
  const { name, mobile, password, address } = req.body
  if (
    name === undefined ||
    mobile === undefined ||
    mobile.length === 0 ||
    password === undefined ||
    password.length === 0 ||
    address.length === 0
  )
    return res.status(400).json({ message: "Bad request" })
  try {
    let user = await User.findOne({ mobile })
    if (user) return res.status(403).json({ message: "User already exists" })
    // name = translate(name);
    user = new User({
      name,
      mobile,
      password,
      address
    })
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    await user.save()
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET
    )
    // res.cookie.accessToken = token;
    res.cookie("accessToken", token)
    res.cookie("role", "user") // Sending role also in cookie. This is for frontend to know which role is logged in
    res.cookie("userId", user._id.valueOf())
    return res.status(201).json({
      accessToken: token,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
