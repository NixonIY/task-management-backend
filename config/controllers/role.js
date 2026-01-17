const Role = require("../models/Role");
const { Op } = require("sequelize");

exports.getAllRoles = async (req, res) => {
  try {
    const roleList = await Role.findAll();
    return res.status(200).json(roleList);
  } catch (error) {
    console.error("❌ Error fetching roles:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jabatan",
      error: error.message,
    });
  }
};

exports.getOneRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({ message: "Jabatan tidak ditemukan" });
    }

    return res.status(200).json(role);
  } catch (error) {
    console.error("❌ Error fetching role:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data jabatan",
      error: error.message,
    });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { jabatan } = req.body;

    if (!jabatan) {
      return res.status(400).json({ message: "Nama jabatan harus diisi" });
    }

    const existingRole = await Role.findOne({ where: { jabatan } });
    if (existingRole) {
      return res
        .status(400)
        .json({ message: "Jabatan dengan nama ini sudah ada" });
    }

    const newRole = await Role.create({ jabatan });

    return res.status(201).json({
      message: "Jabatan berhasil ditambahkan",
      data: newRole,
    });
  } catch (error) {
    console.error("❌ Error creating role:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menambahkan jabatan",
      error: error.message,
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { jabatan } = req.body;

    if (!jabatan) {
      return res.status(400).json({ message: "Nama jabatan harus diisi" });
    }

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({ message: "Jabatan tidak ditemukan" });
    }

    const existingRole = await Role.findOne({
      where: {
        jabatan,
        id: { [Op.ne]: id },
      },
    });

    if (existingRole) {
      return res
        .status(400)
        .json({ message: "Jabatan dengan nama ini sudah ada" });
    }

    await role.update({ jabatan });

    return res.status(200).json({
      message: "Jabatan berhasil diperbarui",
      data: role,
    });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui jabatan",
      error: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({ message: "Jabatan tidak ditemukan" });
    }

    await role.destroy();

    return res.status(200).json({
      message: "Jabatan berhasil dihapus",
    });
  } catch (error) {
    console.error("❌ Error deleting role:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menghapus jabatan",
      error: error.message,
    });
  }
};
