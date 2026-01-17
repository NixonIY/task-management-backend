const { DataTypes } = require("sequelize");
const db = require("../db");

const Jadwal = db.define(
  "jadwal",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hari: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: "jadwal",
    timestamps: false,
  }
);

module.exports = Jadwal;
