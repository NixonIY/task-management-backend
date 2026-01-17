const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

// Initialize Express app FIRST
const app = express();
const PORT = process.env.PORT || 3001;

// FIXED: Move bodyParser middleware after app initialization
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Import models
const Users = require("./config/models/Users");
const Divisi = require("./config/models/Divisi");
const Role = require("./config/models/Role");
const Members = require("./config/models/Members");
const JamIbadah = require("./config/models/JamIbadah");
const Jadwal = require("./config/models/Jadwal");
const Absensi = require("./config/models/Absensi");

// Import routes
const usersRoutes = require("./config/routes/users");
const divisiRoutes = require("./config/routes/divisi");
const roleRoutes = require("./config/routes/role");
const membersRoutes = require("./config/routes/members");
const jadwalRoutes = require("./config/routes/jadwal");
const jamIbadahRoutes = require("./config/routes/jamIbadah");
const absensiRoutes = require("./config/routes/absensi");
const semiVolunteerRoutes = require("./config/routes/semi-volunteer");
const usersMembersRoutes = require("./config/routes/users-members");

// Import seeder
require("./config/seeders");

// SIMPLIFIED: Define paths more clearly
const rootDir = __dirname;
const uploadsDir = path.join(rootDir, "uploads");
const publicDir = path.join(rootDir, "public");
const imagesDir = path.join(publicDir, "images");

console.log("Root directory:", rootDir);
console.log("Uploads directory:", uploadsDir);
console.log("Public directory:", publicDir);
console.log("Images directory:", imagesDir);

// Create directories if they don't exist
[uploadsDir, publicDir, imagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// CRITICAL: Copy default profile image if it doesn't exist
const defaultProfileSrc = path.join(rootDir, "default-profile.jpg"); // Assuming you have this file
const defaultProfileDest = path.join(imagesDir, "default-profile.jpg");

if (fs.existsSync(defaultProfileSrc) && !fs.existsSync(defaultProfileDest)) {
  try {
    fs.copyFileSync(defaultProfileSrc, defaultProfileDest);
    console.log("Default profile image copied to:", defaultProfileDest);
  } catch (err) {
    console.error("Error copying default profile image:", err);
  }
}

// CORS Configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).send();
});

app.use(express.json());

// SIMPLIFIED: Static file serving with better logging
// 1. Serve uploads directory
app.use("/uploads", (req, res, next) => {
  console.log(`[STATIC] Request for /uploads${req.path}`);
  express.static(uploadsDir)(req, res, next);
});

// 2. Serve public directory
app.use("/public", (req, res, next) => {
  console.log(`[STATIC] Request for /public${req.path}`);
  express.static(publicDir)(req, res, next);
});

// 3. Serve images directory
app.use("/images", (req, res, next) => {
  console.log(`[STATIC] Request for /images${req.path}`);
  express.static(imagesDir)(req, res, next);
});

// 4. Serve static files from root
app.use(express.static(publicDir));

// ENHANCED: Direct file access API with detailed logging
app.get("/api/files/:filename", (req, res) => {
  const filename = req.params.filename;
  console.log(`[API] File request for: ${filename}`);

  // Remove any leading slashes
  const cleanFilename = filename.replace(/^\/+/, "");

  // Try multiple locations
  const possiblePaths = [
    path.join(uploadsDir, cleanFilename),
    path.join(imagesDir, cleanFilename),
    path.join(publicDir, cleanFilename),
    path.join(rootDir, cleanFilename),
  ];

  console.log("[API] Searching in paths:", possiblePaths);

  for (const filePath of possiblePaths) {
    console.log(`[API] Checking: ${filePath}`);
    if (fs.existsSync(filePath)) {
      console.log(`[API] Found file at: ${filePath}`);
      return res.sendFile(filePath);
    }
  }

  console.log(`[API] File not found: ${filename}`);
  res
    .status(404)
    .json({ error: "File not found", searchedPaths: possiblePaths });
});

// ENHANCED: Special handler for default profile image
app.get("/default-profile.jpg", (req, res) => {
  console.log("[API] Request for default profile image");
  const defaultProfilePath = path.join(imagesDir, "default-profile.jpg");

  if (fs.existsSync(defaultProfilePath)) {
    console.log(`[API] Serving default profile from: ${defaultProfilePath}`);
    return res.sendFile(defaultProfilePath);
  }

  console.log("[API] Default profile image not found");
  res.status(404).send("Default profile image not found");
});

// ENHANCED: Special handler for profile images with path correction
app.get("/api/profile-image/:filename", (req, res) => {
  const filename = req.params.filename;
  console.log(`[API] Profile image request for: ${filename}`);

  // Try both uploads and images directories
  const uploadsPath = path.join(uploadsDir, filename);
  const imagesPath = path.join(imagesDir, filename);

  if (fs.existsSync(uploadsPath)) {
    console.log(`[API] Serving profile from uploads: ${uploadsPath}`);
    return res.sendFile(uploadsPath);
  }

  if (fs.existsSync(imagesPath)) {
    console.log(`[API] Serving profile from images: ${imagesPath}`);
    return res.sendFile(imagesPath);
  }

  // If filename contains "default-profile", try to serve the default
  if (filename.includes("default-profile")) {
    const defaultPath = path.join(imagesDir, "default-profile.jpg");
    if (fs.existsSync(defaultPath)) {
      console.log(`[API] Serving default profile: ${defaultPath}`);
      return res.sendFile(defaultPath);
    }
  }

  console.log(`[API] Profile image not found: ${filename}`);
  res.status(404).send("Profile image not found");
});

// CRITICAL: Special handler for path correction
app.use((req, res, next) => {
  // Check if the request is for an image with a leading slash in the path
  if (req.path.match(/^\/(uploads|images)\/.+\.(jpg|jpeg|png|gif)$/i)) {
    const correctedPath = req.path.replace(/^\/+/, "");
    console.log(
      `[PATH CORRECTION] Redirecting ${req.path} to /${correctedPath}`
    );
    return res.redirect(`/${correctedPath}`);
  }
  next();
});

// ENHANCED: Debug endpoint to list all files
app.get("/api/debug/list-files", (req, res) => {
  const result = {};

  try {
    // List files in uploads directory
    if (fs.existsSync(uploadsDir)) {
      result.uploads = fs.readdirSync(uploadsDir);
    } else {
      result.uploads = { error: "Directory does not exist" };
    }

    // List files in public directory
    if (fs.existsSync(publicDir)) {
      result.public = fs.readdirSync(publicDir);
    } else {
      result.public = { error: "Directory does not exist" };
    }

    // List files in images directory
    if (fs.existsSync(imagesDir)) {
      result.images = fs.readdirSync(imagesDir);
    } else {
      result.images = { error: "Directory does not exist" };
    }

    res.json({
      directories: {
        root: rootDir,
        uploads: uploadsDir,
        public: publicDir,
        images: imagesDir,
      },
      files: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use("/api/users", usersRoutes);
app.use("/api/divisi", divisiRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/jam-ibadah", jamIbadahRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/semi-volunteer", semiVolunteerRoutes);
app.use("/api/users-members", usersMembersRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    staticPaths: {
      uploads: "/uploads",
      public: "/public",
      images: "/images",
      apiFiles: "/api/files",
      apiProfileImage: "/api/profile-image",
    },
  });
});

// Database connection and sync
(async () => {
  try {
    await db.authenticate();
    console.log("✅ Koneksi ke database berhasil");

    // Define model associations
    // Users associations
    Users.belongsTo(Role, { foreignKey: "role_id" });
    Users.belongsTo(Divisi, { foreignKey: "divisi_id" });
    Role.hasMany(Users, { foreignKey: "role_id" });
    Divisi.hasMany(Users, { foreignKey: "divisi_id" });

    // Members associations
    Members.belongsTo(Divisi, { foreignKey: "divisi_id" });
    Divisi.hasMany(Members, { foreignKey: "divisi_id" });

    // Absensi associations
    Absensi.belongsTo(Members, { foreignKey: "member_id" });
    Absensi.belongsTo(JamIbadah, { foreignKey: "jam_ibadah_id" });
    Absensi.belongsTo(Jadwal, { foreignKey: "jadwal_id" });

    Members.hasMany(Absensi, { foreignKey: "member_id" });
    JamIbadah.hasMany(Absensi, { foreignKey: "jam_ibadah_id" });
    Jadwal.hasMany(Absensi, { foreignKey: "jadwal_id" });

    // Sync all models with database
    await db.sync({ alter: true });
    console.log("✅ Model berhasil disesuaikan dengan tabel di database");
  } catch (error) {
    console.error("❌ Gagal koneksi ke database:", error);
  }
})();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({
    message: "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`📁 Static files tersedia di:`);
  console.log(`   - http://localhost:${PORT}/uploads/`);
  console.log(`   - http://localhost:${PORT}/public/`);
  console.log(`   - http://localhost:${PORT}/images/`);
  console.log(`   - http://localhost:${PORT}/api/files/`);
  console.log(`   - http://localhost:${PORT}/api/profile-image/`);
  console.log(`🔍 Debug endpoint:`);
  console.log(`   - http://localhost:${PORT}/api/debug/list-files`);
});

module.exports = app;
