const { DataTypes } = require("sequelize");
const db = require("../../config/db");

const Role = db.define(
  "Role",
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
    tableName: "role",
    timestamps: false,
  }
);

module.exports = Role;
