const { DataTypes } = require("sequelize");
const db = require("../db");

const JamIbadah = db.define(
  "jam_ibadah",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jam_ibadah: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    nama_ibadah: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "jam_ibadah",
    timestamps: false,
  }
);

module.exports = JamIbadah;
