const Divisi = require("../models/Divisi");
const { Op } = require("sequelize");

// Get all divisions
exports.getAllDivisi = async (req, res) => {
  try {
    const divisiList = await Divisi.findAll();
    return res.status(200).json(divisiList);
  } catch (error) {
    console.error("❌ Error fetching divisions:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data divisi",
      error: error.message,
    });
  }
};

// Get a single division by ID
exports.getOneDivisi = async (req, res) => {
  try {
    const { id } = req.params;

    const divisi = await Divisi.findByPk(id);

    if (!divisi) {
      return res.status(404).json({ message: "Divisi tidak ditemukan" });
    }

    return res.status(200).json(divisi);
  } catch (error) {
    console.error("❌ Error fetching division:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data divisi",
      error: error.message,
    });
  }
};

// Create a new division
exports.createDivisi = async (req, res) => {
  try {
    const { nama } = req.body;

    if (!nama) {
      return res.status(400).json({ message: "Nama divisi harus diisi" });
    }

    const newDivisi = await Divisi.create({ nama });

    return res.status(201).json({
      message: "Divisi berhasil ditambahkan",
      data: newDivisi,
    });
  } catch (error) {
    console.error("❌ Error creating division:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menambahkan divisi",
      error: error.message,
    });
  }
};

// Update a division
exports.updateDivisi = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;

    if (!nama) {
      return res.status(400).json({ message: "Nama divisi harus diisi" });
    }

    const divisi = await Divisi.findByPk(id);

    if (!divisi) {
      return res.status(404).json({ message: "Divisi tidak ditemukan" });
    }

    await divisi.update({ nama });

    return res.status(200).json({
      message: "Divisi berhasil diperbarui",
      data: divisi,
    });
  } catch (error) {
    console.error("❌ Error updating division:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui divisi",
      error: error.message,
    });
  }
};

// Delete a division
exports.deleteDivisi = async (req, res) => {
  try {
    const { id } = req.params;

    const divisi = await Divisi.findByPk(id);

    if (!divisi) {
      return res.status(404).json({ message: "Divisi tidak ditemukan" });
    }

    await divisi.destroy();

    return res.status(200).json({
      message: "Divisi berhasil dihapus",
    });
  } catch (error) {
    console.error("❌ Error deleting division:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menghapus divisi",
      error: error.message,
    });
  }
};
