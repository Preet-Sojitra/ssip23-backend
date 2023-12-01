const { StatusCodes } = require("http-status-codes")
const bcrypt = require("bcryptjs")
const Users = require("../models/users")
const { issueToken } = require("../middlewares/auth")

exports.signup = async (req, res, next) => {
  try {
    const { name, mobile, password, role } = req.body

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await Users.create({
      name,
      mobile,
      password: hashedPassword,
      role,
    })

    const token = issueToken({
      id: user._id,
      role: user.role,
      name: user.name,
      mobile: user.mobile,
    })

    return res.status(StatusCodes.CREATED).json({
      msg: "User created successfully",
      accessToken: token,
    })
  } catch (error) {
    next(error)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { mobile, password } = req.body

    // Need to check if user exists
    const user = await Users.findOne({ mobile })

    if (!user) {
      const error = new Error("User does not exist")
      error.statusCode = StatusCodes.NOT_FOUND
      return next(error)
    }

    // If user exits, then match password
    const hashedPassword = user.password
    const isMatch = await bcrypt.compare(password, hashedPassword)

    if (!isMatch) {
      const error = new Error("Invalid credentials")
      error.statusCode = StatusCodes.UNAUTHORIZED
      return next(error)
    }

    // If all ok, then send token
    const token = issueToken({
      id: user._id,
      role: user.role,
      name: user.name,
      mobile: user.mobile,
    })

    return res.status(StatusCodes.OK).json({
      msg: "User logged in successfully",
      accessToken: token,
    })
  } catch (error) {
    next(error)
  }
}
