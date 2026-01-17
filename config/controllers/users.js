const bcrypt = require("bcryptjs");
const Users = require("../models/Users");
const { sendEmail } = require("../emailService");
const { Op } = require("sequelize");

exports.getAllUsers = async (req, res) => {
  try {
    console.log("Getting all users, requested by:", req.user.email);

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
        { model: Role, attributes: ["id", "nama"] },
        { model: Divisi, attributes: ["id", "nama"] },
      ],
    });

    console.log(`Found ${users.length} users`);

    // Return users array
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Gagal mengambil data pengguna",
      error: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user is admin or requesting their own data
    if (req.user.role !== "Admin" && req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({
        message: "Unauthorized: You can only access your own data",
      });
    }

    const user = await Users.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["id", "nama"] },
        { model: Divisi, attributes: ["id", "nama"] },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "Gagal mengambil data pengguna",
      error: error.message,
    });
  }
};

exports.getOneUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Users.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pengguna",
      error: error.message,
    });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await Users.findOne({
      where: { username },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user by username:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pengguna",
      error: error.message,
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { email, nama, divisi, role } = req.body;

    const existingUser = await Users.findOne({ where: { username: email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Users.create({
      username: email,
      password: hashedPassword,
      nama,
      divisi,
      role,
    });

    const emailSent = await sendEmail(
      email,
      "Akses Akun Semi Volunteer",
      `<p>Halo ${nama},</p>
      <p>Berikut adalah informasi akun Anda:</p>
      <ul>
        <li><strong>Username (Email):</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Silakan login dan segera ganti password Anda.</p>`
    );

    if (!emailSent) {
      return res.status(500).json({
        message: "Registrasi berhasil, tetapi email gagal dikirim",
      });
    }

    return res.status(201).json({
      message: "Registrasi berhasil dan email terkirim",
      data: {
        id: newUser.id,
        username: newUser.username,
        nama: newUser.nama,
        divisi: newUser.divisi,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat registrasi",
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nama, divisi, role, password } = req.body;

    const user = await Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    if (username !== user.username) {
      const existingUser = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: id },
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username sudah digunakan" });
      }
    }

    const updateData = {
      username,
      nama,
      divisi,
      role,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        divisi: user.divisi,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui profil",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    await user.update({ status: 0 });

    return res.status(200).json({
      message: "Pengguna berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menghapus pengguna",
      error: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const userData = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      divisi: user.divisi,
      role: user.role,
    };

    return res.status(200).json({
      message: "Login berhasil",
      data: userData,
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat login",
      error: error.message,
    });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password, adminId } = req.body;

    // Get the admin user
    const adminUser = await Users.findByPk(adminId);
    if (!adminUser || adminUser.role_id !== 2) {
      // Assuming role_id 2 is Admin
      return res.status(403).json({
        message: "Unauthorized: Only admins can reset other users' passwords",
      });
    }

    // Get the target user
    const targetUser = await Users.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if target user is PIC or Semi Volunteer
    if (targetUser.role_id !== 3 && targetUser.role_id !== 4) {
      // Assuming role_id 3 is PIC and 4 is Semi Volunteer
      return res.status(403).json({
        message:
          "Unauthorized: Admins can only reset passwords for PIC and Semi Volunteer users",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await targetUser.update({ password: hashedPassword });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    return res.status(500).json({
      message: "An error occurred while resetting the password",
      error: error.message,
    });
  }
};

// Modify the existing changePassword function to check user role
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword, requestingUserId } = req.body;

    // Get the requesting user
    const requestingUser = await Users.findByPk(requestingUserId);
    if (!requestingUser) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    // Get the target user
    const targetUser = await Users.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // If the requesting user is not an admin and is trying to change someone else's password
    if (requestingUser.role_id !== 2 && requestingUserId !== id) {
      return res.status(403).json({
        message: "Unauthorized: You can only change your own password",
      });
    }

    // If the requesting user is an admin but target is not PIC or Semi Volunteer
    if (
      requestingUser.role_id === 2 &&
      targetUser.role_id !== 3 &&
      targetUser.role_id !== 4
    ) {
      return res.status(403).json({
        message:
          "Unauthorized: Admins can only change passwords for PIC and Semi Volunteer users",
      });
    }

    // If changing own password, verify current password
    if (requestingUserId === id) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        targetUser.password
      );

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await targetUser.update({ password: hashedPassword });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    return res.status(500).json({
      message: "An error occurred while changing the password",
      error: error.message,
    });
  }
};
