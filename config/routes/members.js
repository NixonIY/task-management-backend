const express = require("express");
const router = express.Router();
const Members = require("../models/Members");
const Divisi = require("../models/Divisi");
const { Op } = require("sequelize");

// Get all members
router.get("/", async (req, res) => {
  try {
    const { divisi_id } = req.query;
    const whereClause = {};

    // If divisi_id is provided, filter by division
    if (divisi_id) {
      whereClause.divisi_id = divisi_id;
    }

    const members = await Members.findAll({
      where: whereClause,
      include: [{ model: Divisi, attributes: ["nama"] }],
      order: [["nama", "ASC"]],
    });

    res.json(members);
  } catch (error) {
    console.error("❌ Error fetching members:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data anggota",
      error: error.message,
    });
  }
});

// Get member by ID
router.get("/:id", async (req, res) => {
  try {
    const member = await Members.findByPk(req.params.id, {
      include: [{ model: Divisi, attributes: ["nama"] }],
    });

    if (!member) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    res.json(member);
  } catch (error) {
    console.error("❌ Error fetching member:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data anggota",
      error: error.message,
    });
  }
});

// Create new member
router.post("/", async (req, res) => {
  try {
    const { foto, nama, divisi_id, posisi, kontak, status } = req.body;

    // Create member
    const newMember = await Members.create({
      foto,
      nama,
      divisi_id,
      posisi,
      kontak,
      status: status || "Active",
    });

    const memberWithDivisi = await Members.findByPk(newMember.id, {
      include: [{ model: Divisi, attributes: ["nama"] }],
    });

    res.status(201).json(memberWithDivisi);
  } catch (error) {
    console.error("❌ Error creating member:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat membuat anggota baru",
      error: error.message,
    });
  }
});

// Update member
router.put("/:id", async (req, res) => {
  try {
    const { foto, nama, divisi_id, posisi, kontak, status } = req.body;
    const memberId = req.params.id;

    // Check if member exists
    const member = await Members.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    // Update member
    await Members.update(
      { foto, nama, divisi_id, posisi, kontak, status },
      { where: { id: memberId } }
    );

    const updatedMember = await Members.findByPk(memberId, {
      include: [{ model: Divisi, attributes: ["nama"] }],
    });

    res.json(updatedMember);
  } catch (error) {
    console.error("❌ Error updating member:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui anggota",
      error: error.message,
    });
  }
});

// Delete member
router.delete("/:id", async (req, res) => {
  try {
    const memberId = req.params.id;

    // Check if member exists
    const member = await Members.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    await Members.destroy({ where: { id: memberId } });

    res.json({ message: "Anggota berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error deleting member:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus anggota",
      error: error.message,
    });
  }
});

module.exports = router;
