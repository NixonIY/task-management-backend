const jwt = require("jsonwebtoken");

// Middleware untuk memeriksa autentikasi
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Simpan data user ke req untuk digunakan di route
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token tidak valid atau kedaluwarsa" });
  }
};

module.exports = { authenticateToken };
