const express = require("express");
const router = express.Router();
const JamIbadah = require("../models/JamIbadah");

// Get all jam ibadah
router.get("/", async (req, res) => {
  try {
    const jamIbadah = await JamIbadah.findAll({
      order: [["jam_ibadah", "ASC"]],
    });
    res.json(jamIbadah);
  } catch (error) {
    console.error("❌ Error fetching jam ibadah:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jam ibadah",
      error: error.message,
    });
  }
});

// Get jam ibadah by ID
router.get("/:id", async (req, res) => {
  try {
    const jamIbadah = await JamIbadah.findByPk(req.params.id);

    if (!jamIbadah) {
      return res.status(404).json({ message: "Jam ibadah tidak ditemukan" });
    }

    res.json(jamIbadah);
  } catch (error) {
    console.error("❌ Error fetching jam ibadah:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jam ibadah",
      error: error.message,
    });
  }
});

// Create new jam ibadah
router.post("/", async (req, res) => {
  try {
    const { jam_ibadah, nama_ibadah } = req.body;

    // Check if jam ibadah already exists
    const existingJamIbadah = await JamIbadah.findOne({
      where: { jam_ibadah, nama_ibadah },
    });

    if (existingJamIbadah) {
      return res
        .status(400)
        .json({ message: "Jam ibadah dengan nama tersebut sudah ada" });
    }

    // Create jam ibadah
    const newJamIbadah = await JamIbadah.create({
      jam_ibadah,
      nama_ibadah,
    });

    res.status(201).json(newJamIbadah);
  } catch (error) {
    console.error("❌ Error creating jam ibadah:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat membuat jam ibadah baru",
      error: error.message,
    });
  }
});

// Update jam ibadah
router.put("/:id", async (req, res) => {
  try {
    const { jam_ibadah, nama_ibadah } = req.body;
    const jamIbadahId = req.params.id;

    // Check if jam ibadah exists
    const jamIbadah = await JamIbadah.findByPk(jamIbadahId);
    if (!jamIbadah) {
      return res.status(404).json({ message: "Jam ibadah tidak ditemukan" });
    }

    // Update jam ibadah
    await JamIbadah.update(
      { jam_ibadah, nama_ibadah },
      { where: { id: jamIbadahId } }
    );

    const updatedJamIbadah = await JamIbadah.findByPk(jamIbadahId);

    res.json(updatedJamIbadah);
  } catch (error) {
    console.error("❌ Error updating jam ibadah:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui jam ibadah",
      error: error.message,
    });
  }
});

// Delete jam ibadah
router.delete("/:id", async (req, res) => {
  try {
    const jamIbadahId = req.params.id;

    // Check if jam ibadah exists
    const jamIbadah = await JamIbadah.findByPk(jamIbadahId);
    if (!jamIbadah) {
      return res.status(404).json({ message: "Jam ibadah tidak ditemukan" });
    }

    await JamIbadah.destroy({ where: { id: jamIbadahId } });

    res.json({ message: "Jam ibadah berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error deleting jam ibadah:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus jam ibadah",
      error: error.message,
    });
  }
});

module.exports = router;
