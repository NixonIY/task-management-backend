const { DataTypes } = require("sequelize");
const db = require("../db");

const Members = db.define(
  "members",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    foto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    divisi_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    posisi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kontak: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "members",
    timestamps: false,
  }
);

module.exports = Members;
