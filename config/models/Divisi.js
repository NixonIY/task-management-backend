const { DataTypes } = require("sequelize");
const db = require("../../config/db");

const Divisi = db.define(
  "Divisi",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "divisi",
    timestamps: false,
  }
);

module.exports = Divisi;
