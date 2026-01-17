const bcrypt = require("bcrypt");
const db = require("./db");
const Role = require("./models/Role");
const Divisi = require("./models/Divisi");
const Users = require("./models/Users");

// Fungsi untuk menambahkan data awal
async function seedDatabase() {
  try {
    // Cek koneksi database
    await db.authenticate();
    console.log("✅ Koneksi ke database berhasil");

    // Sinkronisasi model dengan database
    await db.sync({ alter: true });
    console.log("✅ Model berhasil disesuaikan dengan tabel di database");

    // Tambahkan data role jika belum ada
    const roles = await Role.findAll();
    if (roles.length === 0) {
      await Role.bulkCreate([
        { nama: "Admin" },
        { nama: "PIC" },
        { nama: "Pihak Gereja" },
      ]);
      console.log("✅ Data role berhasil ditambahkan");
    }

    // Tambahkan data divisi jika belum ada
    const divisi = await Divisi.findAll();
    if (divisi.length === 0) {
      await Divisi.bulkCreate([
        { nama: "Production" },
        { nama: "PAW" },
        { nama: "Tim Musik" },
        { nama: "SM" },
      ]);
      console.log("✅ Data divisi berhasil ditambahkan");
    }

    // Tambahkan user admin jika belum ada
    const adminUser = await Users.findOne({
      where: { email: "admin@gsjs.com" },
    });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await Users.create({
        email: "admin@gsjs.com",
        password: hashedPassword,
        role_id: 1, // Admin role
        divisi_id: null,
      });
      console.log("✅ User admin berhasil ditambahkan");
    }

    console.log("✅ Seeding database selesai");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Jalankan fungsi seeding
seedDatabase();
