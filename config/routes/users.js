const express = require("express");
const router = express.Router();
const Users = require("../models/Users");
const Role = require("../models/Role");
const Divisi = require("../models/Divisi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../../middleware/authMiddleware"); // Changed this line

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await Users.findOne({
      where: { email },
      include: [
        { model: Role, attributes: ["nama"] },
        { model: Divisi, attributes: ["nama"] },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role?.nama,
        divisi: user.Divisi?.nama,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        email: user.email,
        role: user.Role?.nama,
        divisi: user.Divisi?.nama,
      },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ message: "Gagal melakukan login", error: error.message });
  }
});

// Get all users - protected route
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Log the request for debugging
    console.log(
      "Get all users request from:",
      req.user.email,
      "with role:",
      req.user.role
    );

    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Unauthorized: Admin access required",
        requestedBy: req.user.email,
        userRole: req.user.role,
      });
    }

    const users = await Users.findAll({
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["nama"] },
        { model: Divisi, attributes: ["nama"] },
      ],
    });

    console.log(`Found ${users.length} users`);

    // Return the users array directly
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data pengguna", error: error.message });
  }
});

// Get user by ID - protected route
router.get("/:id", authenticateToken, async (req, res) => {
  // Changed this line
  try {
    // Check if user is admin or requesting their own data
    if (
      req.user.role !== "Admin" &&
      req.user.id !== Number.parseInt(req.params.id)
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only access your own data" });
    }

    const user = await Users.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["nama"] },
        { model: Divisi, attributes: ["nama"] },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data pengguna", error: error.message });
  }
});

// Create new user - admin only
router.post("/", authenticateToken, async (req, res) => {
  // Changed this line
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { email, password, role_id, divisi_id } = req.body;

    // Check if email already exists
    const existingUser = await Users.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await Users.create({
      email,
      password: hashedPassword,
      role_id,
      divisi_id,
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Gagal membuat pengguna baru", error: error.message });
  }
});

// Update user - protected route
router.put("/:id", authenticateToken, async (req, res) => {
  // Changed this line
  try {
    const userId = Number.parseInt(req.params.id);
    const { email, password, role_id, divisi_id } = req.body;

    // Check authorization
    // Admin can update any user
    // Non-admin can only update themselves
    if (req.user.role !== "Admin" && req.user.id !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You can only update your own profile",
      });
    }

    // If non-admin is trying to change role_id
    if (req.user.role !== "Admin" && role_id) {
      return res.status(403).json({
        message: "Unauthorized: You cannot change your role",
      });
    }

    const user = await Users.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    // Update user data
    const updateData = {};

    // Only update fields that are provided
    if (email) updateData.email = email;
    if (role_id && req.user.role === "Admin") updateData.role_id = role_id;
    if (divisi_id) updateData.divisi_id = divisi_id;

    // If password is provided, hash it
    if (password) {
      // Additional check for password reset
      // Admin can reset password for PIC and Semi Volunteer
      // Non-admin can only reset their own password
      const targetUserRole = await Role.findByPk(user.role_id);

      if (req.user.role !== "Admin" && req.user.id !== userId) {
        return res.status(403).json({
          message: "Unauthorized: You can only reset your own password",
        });
      }

      if (
        req.user.role === "Admin" &&
        targetUserRole.nama !== "PIC" &&
        targetUserRole.nama !== "Semi Volunteer"
      ) {
        return res.status(403).json({
          message:
            "Unauthorized: Admin can only reset passwords for PIC and Semi Volunteer users",
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Gagal memperbarui pengguna", error: error.message });
  }
});

// Delete user - admin only
router.delete("/:id", authenticateToken, async (req, res) => {
  // Changed this line
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const user = await Users.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    await user.destroy();

    res.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Gagal menghapus pengguna", error: error.message });
  }
});

module.exports = router;
