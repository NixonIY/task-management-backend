const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const Users = require("../models/Users");
const Divisi = require("../models/Divisi");
const Role = require("../models/Role");
const Members = require("../models/Members");
const bcrypt = require("bcrypt");
const { sendWelcomeEmail, generateRandomPassword } = require("../emailService");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the correct path relative to the server.js file
    const uploadDir = path.join(__dirname, "../../uploads");
    console.log("Upload directory path:", uploadDir);

    if (!fs.existsSync(uploadDir)) {
      console.log("Creating upload directory:", uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = "profile-" + uniqueSuffix + ext;
    console.log("Generated filename:", filename);
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST route to create a new semi-volunteer (member + user)
router.post("/", upload.single("photo"), async (req, res) => {
  const transaction = await db.transaction();

  try {
    console.log("Received request body:", req.body);
    console.log(
      "Received file:",
      req.file ? req.file.filename : "No file uploaded"
    );

    // Validate required fields
    const requiredFields = ["email", "nama", "divisi", "posisi", "phoneNumber"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Semua field harus diisi",
        missingFields: missingFields,
      });
    }

    // Get divisi_id based on divisi name
    const divisiData = await Divisi.findOne({
      where: { nama: req.body.divisi },
    });
    if (!divisiData) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: `Divisi tidak ditemukan: ${req.body.divisi}` });
    }
    const divisi_id = divisiData.id;

    // Get role_id based on role name
    const roleData = await Role.findOne({
      where: { nama: req.body.role || "Semi Volunteer" },
    });
    if (!roleData) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Role tidak ditemukan: ${req.body.role || "Semi Volunteer"}`,
      });
    }
    const role_id = roleData.id;

    // Format phone number
    let formattedPhone;
    try {
      formattedPhone = Number.parseInt(
        req.body.phoneNumber.toString().replace(/\D/g, ""),
        10
      );
      if (isNaN(formattedPhone)) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Nomor telepon harus berupa angka" });
      }
    } catch (error) {
      console.error("Error formatting phone number:", error);
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Format nomor telepon tidak valid" });
    }

    // Generate random password
    const randomPassword = generateRandomPassword(12);
    console.log(
      `🔐 Generated password for ${req.body.email}: ${randomPassword}`
    );

    // Hash the random password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create user record
    const user = await Users.create(
      {
        email: req.body.email,
        password: hashedPassword,
        role_id: role_id,
        divisi_id: divisi_id,
      },
      { transaction }
    );

    // Set default photo path
    let photoPath = "/images/default-profile.jpg";

    // Add photo path if a file was uploaded
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
      console.log("Photo uploaded successfully:", req.file.filename);
      console.log("Full file path:", req.file.path);
      console.log("Setting photo path to:", photoPath);
    } else {
      console.log("No file uploaded, using default photo path:", photoPath);
    }

    // Prepare member data
    const memberData = {
      foto: photoPath, // Use 'foto' field to match your database schema
      nama: req.body.nama,
      divisi_id: divisi_id,
      posisi: req.body.posisi,
      kontak: formattedPhone,
      status: "Active",
      user_id: user.id,
    };

    console.log("Creating member with data:", memberData);

    // Create member record
    const member = await Members.create(memberData, { transaction });

    console.log("Member created successfully:", member.id);

    await transaction.commit();
    console.log("Transaction committed successfully");

    // Prepare volunteer data for email
    const volunteerData = {
      email: req.body.email,
      nama: req.body.nama,
      divisi: req.body.divisi,
      role: req.body.role || "Semi Volunteer",
      posisi: req.body.posisi,
      phoneNumber: formattedPhone,
    };

    // Send welcome email
    console.log("📧 Attempting to send welcome email...");
    const emailResult = await sendWelcomeEmail(volunteerData, randomPassword);

    if (emailResult.success) {
      console.log("✅ Welcome email sent successfully");
    } else {
      console.error("❌ Failed to send welcome email:", emailResult.error);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      message: "Semi volunteer berhasil dibuat",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role_id: user.role_id,
          divisi_id: user.divisi_id,
        },
        member: {
          id: member.id,
          nama: member.nama,
          divisi_id: member.divisi_id,
          posisi: member.posisi,
          foto: member.foto,
        },
        emailSent: emailResult.success,
        emailMessage: emailResult.message,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating semi-volunteer:", error);
    res.status(500).json({
      message: "Gagal membuat semi volunteer",
      error: error.message,
    });
  }
});

module.exports = router;
