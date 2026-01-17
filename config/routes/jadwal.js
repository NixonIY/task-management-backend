const express = require("express");
const router = express.Router();
const Jadwal = require("../models/Jadwal");
const JamIbadah = require("../models/JamIbadah");
const JadwalJamIbadah = require("../models/JadwalJamIbadah");
const { Op } = require("sequelize");
const db = require("../db");

// Get all jadwal with optional date range filtering
router.get("/", async (req, res) => {
  try {
    const { start, end } = req.query;
    let whereClause = {};

    // If start and end dates are provided, filter by date range
    if (start && end) {
      whereClause = {
        tanggal: {
          [Op.between]: [start, end],
        },
      };
    }

    const jadwal = await Jadwal.findAll({
      where: whereClause,
      order: [["tanggal", "ASC"]],
    });

    // For each jadwal, get the associated jam_ibadah records
    const result = await Promise.all(
      jadwal.map(async (j) => {
        // Get the jam_ibadah IDs associated with this jadwal
        const jadwalJamIbadah = await JadwalJamIbadah.findAll({
          where: { jadwal_id: j.id },
          attributes: ["jam_ibadah_id"],
        });

        const jamIbadahIds = jadwalJamIbadah.map((jji) => jji.jam_ibadah_id);

        // Get the jam_ibadah records
        let jamIbadah = [];
        if (jamIbadahIds.length > 0) {
          jamIbadah = await JamIbadah.findAll({
            where: {
              id: {
                [Op.in]: jamIbadahIds,
              },
            },
          });
        }

        // Transform to the expected format
        return {
          id: j.id,
          tanggal: j.tanggal,
          hari: j.hari,
          jam_ibadah: jamIbadah.map((jam) => ({
            jam: jam.jam_ibadah,
            nama: jam.nama_ibadah,
          })),
          isSunday: j.hari === "Minggu",
          futureSundays: [],
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching jadwal:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jadwal",
      error: error.message,
    });
  }
});

// Get jadwal by ID
router.get("/:id", async (req, res) => {
  try {
    const jadwal = await Jadwal.findByPk(req.params.id);

    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Get the jam_ibadah IDs associated with this jadwal
    const jadwalJamIbadah = await JadwalJamIbadah.findAll({
      where: { jadwal_id: jadwal.id },
      attributes: ["jam_ibadah_id"],
    });

    const jamIbadahIds = jadwalJamIbadah.map((jji) => jji.jam_ibadah_id);

    // Get the jam_ibadah records
    let jamIbadah = [];
    if (jamIbadahIds.length > 0) {
      jamIbadah = await JamIbadah.findAll({
        where: {
          id: {
            [Op.in]: jamIbadahIds,
          },
        },
      });
    }

    // Transform to the expected format
    const result = {
      id: jadwal.id,
      tanggal: jadwal.tanggal,
      hari: jadwal.hari,
      jam_ibadah: jamIbadah.map((jam) => ({
        jam: jam.jam_ibadah,
        nama: jam.nama_ibadah,
      })),
      isSunday: jadwal.hari === "Minggu",
      futureSundays: [],
    };

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching jadwal:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jadwal",
      error: error.message,
    });
  }
});

// Create new jadwal
router.post("/", async (req, res) => {
  const t = await db.transaction();

  try {
    const { tanggal, hari, jam_ibadah_ids } = req.body;

    // Create jadwal
    const newJadwal = await Jadwal.create(
      {
        tanggal,
        hari,
      },
      { transaction: t }
    );

    // If jam_ibadah_ids are provided, create the associations
    if (
      jam_ibadah_ids &&
      Array.isArray(jam_ibadah_ids) &&
      jam_ibadah_ids.length > 0
    ) {
      const jadwalJamIbadahRecords = jam_ibadah_ids.map((jamIbadahId) => ({
        jadwal_id: newJadwal.id,
        jam_ibadah_id: jamIbadahId,
      }));

      await JadwalJamIbadah.bulkCreate(jadwalJamIbadahRecords, {
        transaction: t,
      });
    }

    await t.commit();

    // Get the complete jadwal with jam_ibadah
    const completeJadwal = await Jadwal.findByPk(newJadwal.id);

    // Get the jam_ibadah IDs associated with this jadwal
    const jadwalJamIbadah = await JadwalJamIbadah.findAll({
      where: { jadwal_id: completeJadwal.id },
      attributes: ["jam_ibadah_id"],
    });

    const jamIbadahIds = jadwalJamIbadah.map((jji) => jji.jam_ibadah_id);

    // Get the jam_ibadah records
    let jamIbadah = [];
    if (jamIbadahIds.length > 0) {
      jamIbadah = await JamIbadah.findAll({
        where: {
          id: {
            [Op.in]: jamIbadahIds,
          },
        },
      });
    }

    // Transform to the expected format
    const result = {
      id: completeJadwal.id,
      tanggal: completeJadwal.tanggal,
      hari: completeJadwal.hari,
      jam_ibadah: jamIbadah.map((jam) => ({
        jam: jam.jam_ibadah,
        nama: jam.nama_ibadah,
      })),
      isSunday: completeJadwal.hari === "Minggu",
      futureSundays: [],
    };

    res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error("❌ Error creating jadwal:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat membuat jadwal baru",
      error: error.message,
    });
  }
});

// Update jadwal
router.put("/:id", async (req, res) => {
  const t = await db.transaction();

  try {
    const { tanggal, hari, jam_ibadah_ids } = req.body;
    const jadwalId = req.params.id;

    // Check if jadwal exists
    const jadwal = await Jadwal.findByPk(jadwalId);
    if (!jadwal) {
      await t.rollback();
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Update jadwal
    await Jadwal.update(
      { tanggal, hari },
      {
        where: { id: jadwalId },
        transaction: t,
      }
    );

    // If jam_ibadah_ids are provided, update the associations
    if (jam_ibadah_ids && Array.isArray(jam_ibadah_ids)) {
      // Delete existing associations
      await JadwalJamIbadah.destroy({
        where: { jadwal_id: jadwalId },
        transaction: t,
      });

      // Create new associations
      if (jam_ibadah_ids.length > 0) {
        const jadwalJamIbadahRecords = jam_ibadah_ids.map((jamIbadahId) => ({
          jadwal_id: jadwalId,
          jam_ibadah_id: jamIbadahId,
        }));

        await JadwalJamIbadah.bulkCreate(jadwalJamIbadahRecords, {
          transaction: t,
        });
      }
    }

    await t.commit();

    // Get the updated jadwal with jam_ibadah
    const updatedJadwal = await Jadwal.findByPk(jadwalId);

    // Get the jam_ibadah IDs associated with this jadwal
    const jadwalJamIbadah = await JadwalJamIbadah.findAll({
      where: { jadwal_id: updatedJadwal.id },
      attributes: ["jam_ibadah_id"],
    });

    const jamIbadahIds = jadwalJamIbadah.map((jji) => jji.jam_ibadah_id);

    // Get the jam_ibadah records
    let jamIbadah = [];
    if (jamIbadahIds.length > 0) {
      jamIbadah = await JamIbadah.findAll({
        where: {
          id: {
            [Op.in]: jamIbadahIds,
          },
        },
      });
    }

    // Transform to the expected format
    const result = {
      id: updatedJadwal.id,
      tanggal: updatedJadwal.tanggal,
      hari: updatedJadwal.hari,
      jam_ibadah: jamIbadah.map((jam) => ({
        jam: jam.jam_ibadah,
        nama: jam.nama_ibadah,
      })),
      isSunday: updatedJadwal.hari === "Minggu",
      futureSundays: [],
    };

    res.json(result);
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating jadwal:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui jadwal",
      error: error.message,
    });
  }
});

// Delete jadwal
router.delete("/:id", async (req, res) => {
  const t = await db.transaction();

  try {
    const jadwalId = req.params.id;

    // Check if jadwal exists
    const jadwal = await Jadwal.findByPk(jadwalId);
    if (!jadwal) {
      await t.rollback();
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Delete associations first
    await JadwalJamIbadah.destroy({
      where: { jadwal_id: jadwalId },
      transaction: t,
    });

    // Delete jadwal
    await Jadwal.destroy({
      where: { id: jadwalId },
      transaction: t,
    });

    await t.commit();

    res.json({ message: "Jadwal berhasil dihapus" });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error deleting jadwal:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus jadwal",
      error: error.message,
    });
  }
});

module.exports = router;
