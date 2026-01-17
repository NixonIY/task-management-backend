const { DataTypes } = require("sequelize");
const db = require("../db");
const Jadwal = require("./Jadwal");
const JamIbadah = require("./JamIbadah");

const JadwalJamIbadah = db.define(
  "jadwal_jam_ibadah",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jadwal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Jadwal,
        key: "id",
      },
    },
    jam_ibadah_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: JamIbadah,
        key: "id",
      },
    },
  },
  {
    tableName: "jadwal_jam_ibadah",
    timestamps: false,
  }
);

// Define associations
JadwalJamIbadah.belongsTo(Jadwal, { foreignKey: "jadwal_id" });
JadwalJamIbadah.belongsTo(JamIbadah, { foreignKey: "jam_ibadah_id" });

module.exports = JadwalJamIbadah;
