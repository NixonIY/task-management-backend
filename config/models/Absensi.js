const { DataTypes } = require("sequelize");
const db = require("../db");
const Members = require("./Members");
const JamIbadah = require("./JamIbadah");
const Jadwal = require("./Jadwal");

const Absensi = db.define(
  "absensi",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Members,
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
    jadwal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Jadwal,
        key: "id",
      },
    },
    hadir: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "absensi",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["member_id", "jam_ibadah_id"],
      },
    ],
  }
);

Absensi.belongsTo(Members, { foreignKey: "member_id" });
Absensi.belongsTo(JamIbadah, { foreignKey: "jam_ibadah_id" });
Absensi.belongsTo(Jadwal, { foreignKey: "jadwal_id" });

module.exports = Absensi;
