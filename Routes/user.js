const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Joi = require('joi');
const jwt = require('jsonwebtoken'),
    cloudinarys = require("../utils/cloudinary.js"),
    upload = require("../utils/mutler.js"),
    path = require("path");
const {isAdmin, auth} = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const router = express.Router();

// Joi validation schema for new user
const userSchema = Joi.object({
  fullname: Joi.string().min(3).required(),
  username: Joi.string().min(3).pattern(/^\S+$/).messages({"string.pattern.base": "Username cannot contain spaces",}).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.ref('password'),
  role: Joi.string().valid('USER', 'ADMIN'),
});

// Joi validation schema for updates
const UesrSchema = Joi.object({
  fullname: Joi.string().min(3),
  username: Joi.string().min(3).pattern(/^\S+$/).messages({"string.pattern.base": "Username cannot contain spaces",}),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  confirmPassword: Joi.ref('password'),
  role: Joi.string().valid('USER', 'ADMIN'),
}).min(1); // must include at least one field

// Helper to remove password
const hidePassword = (user) => {
  if (!user) return user;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

// Create user
router.post("/", (req, res) => {
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { fullname, email, password, username, role} = value;

  User.findOne({ email: email.toLowerCase() })
    .then((existing) => {
      if (existing) {
        res.status(409).json({ message: "Email already in use." });
        return null;
      }

      return bcrypt.hash(password, 10);
    })
    .then((hashedPassword) => {
      if (!hashedPassword) return;

      return User.create({
        fullname,
        username,
        role: role || 'USER',
        email: email.toLowerCase(),
        password: hashedPassword,
      });
    })
    .then((user) => {
      if (!user) return;
      res.status(201).json(hidePassword(user));
    })
    .catch(e => {
      console.error("Error in POST /users:", e);
      res.status(500).json({ message: e.message || "Server error" });
    });
});

router.post("/save-fcm-token", auth, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "FCM token required" });
  }

  await User.findByIdAndUpdate(
    req.user.id,
    { $addToSet: { fcmTokens: token } } // avoid duplicates
  );

  res.json({ message: "FCM token saved" });
});

// List users
router.get('/', (req, res) => {
  User.find()
    .select('-password')
    .then((users) => res.json(users))
    .catch((err) => {
      console.error("Error in GET /users:", err);
      res.status(500).json({ message: err.message || 'Server error' });
    });
});

// GET LOGGED-IN USER USING JWT
router.get("/me", async (req, res) => {
  try {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Fallback: check cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("Error in GET /user/me:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});


// Get user by id
router.get('/:id', (req, res) => {
  User.findById(req.params.id)
    .select('-password')
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    })
    .catch((err) => {
      console.error("Error in GET /users/:id:", err);
      res.status(500).json({ message: err.message || 'Server error' });
    });
});

// Update user
router.put("/:id", upload.single("avatar"), async (req, res) => {
  try {
    // Validate fields correctly
    const { error } = UesrSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find user
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updates = { ...req.body };

    // Hash password if included
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Upload image if provided
    if (req.file) {
      const cloudUpload = await cloudinarys.uploader.upload(req.file.path);
      updates.avatar = cloudUpload.secure_url; // add avatar field
    }

    // Perform update
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Error in PUT /users/:id:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// Delete user
router.delete('/:id', (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .select('-password')
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted', user });
    })
    .catch((err) => {
      console.error("Error in DELETE /users/:id:", err);
      res.status(500).json({ message: err.message || 'Server error' });
    });
});

// LOGIN route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("Error in POST /user/login:", err);
    return res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
