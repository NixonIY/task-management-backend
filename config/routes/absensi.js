const express = require("express");
const router = express.Router();
const Absensi = require("../models/Absensi");
const Members = require("../models/Members");
const JamIbadah = require("../models/JamIbadah");
const Jadwal = require("../models/Jadwal");
const Divisi = require("../models/Divisi");
const { Op } = require("sequelize");
const db = require("../db");

// Get all attendance records with optional filtering
router.get("/", async (req, res) => {
  try {
    const { jadwal_id, member_id, jam_ibadah_id, divisi_id } = req.query;

    const whereClause = {};
    const memberWhereClause = {};

    if (jadwal_id) whereClause.jadwal_id = jadwal_id;
    if (member_id) whereClause.member_id = member_id;
    if (jam_ibadah_id) whereClause.jam_ibadah_id = jam_ibadah_id;
    if (divisi_id) memberWhereClause.divisi_id = divisi_id;

    const absensi = await Absensi.findAll({
      where: whereClause,
      include: [
        {
          model: Members,
          where:
            Object.keys(memberWhereClause).length > 0
              ? memberWhereClause
              : undefined,
          include: [{ model: Divisi, attributes: ["nama"] }],
        },
        { model: JamIbadah },
        { model: Jadwal },
      ],
      order: [
        [Jadwal, "tanggal", "DESC"],
        [JamIbadah, "jam_ibadah", "ASC"],
        [Members, "nama", "ASC"],
      ],
    });

    res.json(absensi);
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data absensi",
      error: error.message,
    });
  }
});

// Get attendance by ID
router.get("/:id", async (req, res) => {
  try {
    const absensi = await Absensi.findByPk(req.params.id, {
      include: [
        { model: Members, include: [{ model: Divisi, attributes: ["nama"] }] },
        { model: JamIbadah },
        { model: Jadwal },
      ],
    });

    if (!absensi) {
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    }

    res.json(absensi);
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data absensi",
      error: error.message,
    });
  }
});

// Create or update attendance (bulk)
router.post("/bulk", async (req, res) => {
  const t = await db.transaction();

  try {
    const { jadwal_id, records } = req.body;

    if (!jadwal_id || !records || !Array.isArray(records)) {
      await t.rollback();
      return res.status(400).json({
        message: "Data tidak valid. Diperlukan jadwal_id dan records (array)",
      });
    }

    // Check if jadwal exists
    const jadwal = await Jadwal.findByPk(jadwal_id);
    if (!jadwal) {
      await t.rollback();
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Process each attendance record
    const results = [];
    for (const record of records) {
      const { member_id, jam_ibadah_id, hadir } = record;

      // Validate required fields
      if (!member_id || !jam_ibadah_id) {
        continue; // Skip invalid records
      }

      // Check if record already exists
      const existingRecord = await Absensi.findOne({
        where: {
          jadwal_id,
          member_id,
          jam_ibadah_id,
        },
      });

      if (existingRecord) {
        // Update existing record
        await existingRecord.update({ hadir }, { transaction: t });
        results.push(existingRecord);
      } else {
        // Create new record
        const newRecord = await Absensi.create(
          {
            jadwal_id,
            member_id,
            jam_ibadah_id,
            hadir: hadir || false,
          },
          { transaction: t }
        );

        results.push(newRecord);
      }
    }

    await t.commit();

    res.status(201).json({
      message: "Absensi berhasil disimpan",
      count: results.length,
      results,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error saving attendance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menyimpan absensi",
      error: error.message,
    });
  }
});

// Create new attendance record
router.post("/", async (req, res) => {
  try {
    const { member_id, jam_ibadah_id, jadwal_id, hadir } = req.body;

    // Check if record already exists
    const existingRecord = await Absensi.findOne({
      where: {
        member_id,
        jam_ibadah_id,
        jadwal_id,
      },
    });

    if (existingRecord) {
      return res.status(400).json({
        message: "Absensi untuk anggota dan jam ibadah ini sudah ada",
        existing: existingRecord,
      });
    }

    // Create attendance record
    const newAbsensi = await Absensi.create({
      member_id,
      jam_ibadah_id,
      jadwal_id,
      hadir: hadir || false,
    });

    const absensiWithRelations = await Absensi.findByPk(newAbsensi.id, {
      include: [
        { model: Members, include: [{ model: Divisi, attributes: ["nama"] }] },
        { model: JamIbadah },
        { model: Jadwal },
      ],
    });

    res.status(201).json(absensiWithRelations);
  } catch (error) {
    console.error("❌ Error creating attendance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat membuat absensi baru",
      error: error.message,
    });
  }
});

// Update attendance
router.put("/:id", async (req, res) => {
  try {
    const { hadir } = req.body;
    const absensiId = req.params.id;

    // Check if attendance exists
    const absensi = await Absensi.findByPk(absensiId);
    if (!absensi) {
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    }

    // Update attendance
    await Absensi.update({ hadir }, { where: { id: absensiId } });

    const updatedAbsensi = await Absensi.findByPk(absensiId, {
      include: [
        { model: Members, include: [{ model: Divisi, attributes: ["nama"] }] },
        { model: JamIbadah },
        { model: Jadwal },
      ],
    });

    res.json(updatedAbsensi);
  } catch (error) {
    console.error("❌ Error updating attendance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui absensi",
      error: error.message,
    });
  }
});

// Delete attendance
router.delete("/:id", async (req, res) => {
  try {
    const absensiId = req.params.id;

    // Check if attendance exists
    const absensi = await Absensi.findByPk(absensiId);
    if (!absensi) {
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    }

    await Absensi.destroy({ where: { id: absensiId } });

    res.json({ message: "Absensi berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error deleting attendance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus absensi",
      error: error.message,
    });
  }
});

module.exports = router;
