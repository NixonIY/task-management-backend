const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");

// Helper function to format photo URLs correctly
const formatPhotoUrl = (photoPath) => {
  if (!photoPath) return null;

  // Remove any leading slashes and 'public/' prefix
  let cleanPath = photoPath.replace(/^\/+/, "").replace(/^public\//, "");

  // Ensure it starts with 'uploads/'
  if (!cleanPath.startsWith("uploads/")) {
    cleanPath = `uploads/${cleanPath}`;
  }

  console.log("Formatted photo path:", cleanPath);
  return cleanPath;
};

// Get all members with their user information using raw SQL
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all members with user information using raw SQL");
    const { search, divisi_id, status } = req.query;

    // Build the SQL query with optional filters
    let sql = `
      SELECT 
        m.id, 
        m.foto, 
        m.nama, 
        m.divisi_id, 
        d.nama AS divisi_nama, 
        m.posisi, 
        m.kontak, 
        m.status,
        u.email,
        r.nama AS role_nama
      FROM members m
      LEFT JOIN divisi d ON m.divisi_id = d.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN role r ON u.role_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += ` AND m.nama LIKE ?`;
      params.push(`%${search}%`);
    }

    if (divisi_id) {
      sql += ` AND m.divisi_id = ?`;
      params.push(divisi_id);
    }

    // Show all members (both Active and Inactive) for admin management
    if (status) {
      sql += ` AND m.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY m.nama ASC`;

    console.log("Executing SQL:", sql);
    console.log("With params:", params);

    // Execute the query
    const [members] = await db.query(sql, params);

    console.log(`Found ${members.length} members`);

    // Transform the data for the frontend
    const transformedMembers = members.map((member) => ({
      id: member.id,
      nama: member.nama,
      foto: formatPhotoUrl(member.foto),
      divisi: member.divisi_nama,
      divisi_id: member.divisi_id,
      posisi: member.posisi,
      kontak: member.kontak,
      status: member.status || "Active",
      email: member.email,
      role: member.role_nama,
    }));

    res.json(transformedMembers);
  } catch (error) {
    console.error("❌ Error fetching members:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data anggota",
      error: error.message,
    });
  }
});

// Get member by ID using raw SQL
router.get("/:id", async (req, res) => {
  try {
    const memberId = req.params.id;

    const sql = `
      SELECT 
        m.id, 
        m.foto, 
        m.nama, 
        m.divisi_id, 
        d.nama AS divisi_nama, 
        m.posisi, 
        m.kontak, 
        m.status,
        u.email,
        r.nama AS role_nama
      FROM members m
      LEFT JOIN divisi d ON m.divisi_id = d.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN role r ON u.role_id = r.id
      WHERE m.id = ?
    `;

    const [members] = await db.query(sql, [memberId]);

    if (members.length === 0) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    const member = members[0];

    // Transform the data for the frontend
    const transformedMember = {
      id: member.id,
      nama: member.nama,
      foto: formatPhotoUrl(member.foto),
      divisi: member.divisi_nama,
      divisi_id: member.divisi_id,
      posisi: member.posisi,
      kontak: member.kontak,
      status: member.status || "Active",
      email: member.email,
      role: member.role_nama,
    };

    res.json(transformedMember);
  } catch (error) {
    console.error("❌ Error fetching member:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data anggota",
      error: error.message,
    });
  }
});

// Update member status - FIXED ENDPOINT
router.post("/:id/update-status", async (req, res) => {
  try {
    const memberId = Number.parseInt(req.params.id);
    const { status } = req.body;

    console.log(`🔄 Updating member ${memberId} status to: ${status}`);
    console.log("Request body:", req.body);

    // Validate status
    if (!status || !["Active", "Inactive"].includes(status)) {
      console.log("❌ Invalid status provided:", status);
      return res.status(400).json({
        message: "Status tidak valid. Gunakan 'Active' atau 'Inactive'",
        receivedStatus: status,
      });
    }

    // Validate member ID
    if (!memberId || isNaN(memberId)) {
      console.log("❌ Invalid member ID:", req.params.id);
      return res.status(400).json({
        message: "ID anggota tidak valid",
        receivedId: req.params.id,
      });
    }

    // Check if member exists first
    console.log("🔍 Checking if member exists...");
    const [existingMembers] = await db.query(
      "SELECT id, nama, status FROM members WHERE id = ?",
      [memberId]
    );

    if (existingMembers.length === 0) {
      console.log("❌ Member not found:", memberId);
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    const currentMember = existingMembers[0];
    console.log("✅ Found member:", currentMember);

    // Update the member status - FIX: Use string interpolation instead of parameter binding
    // IMPORTANT: This is safe ONLY because we've already validated the status value above
    console.log(
      "🔄 Executing update query with direct string interpolation..."
    );
    const updateSql = `UPDATE members SET status = '${status}' WHERE id = ${memberId}`;
    console.log("SQL:", updateSql);

    const [result] = await db.query(updateSql);

    console.log("✅ Update result:", result);

    if (result.affectedRows === 0) {
      console.log("❌ No rows affected");
      return res.status(404).json({ message: "Gagal mengubah status anggota" });
    }

    console.log(
      `✅ Successfully updated member ${memberId} status from ${currentMember.status} to ${status}`
    );

    res.json({
      success: true,
      message: `Status anggota ${currentMember.nama} berhasil diubah menjadi ${status}`,
      data: {
        memberId: memberId,
        memberName: currentMember.nama,
        oldStatus: currentMember.status,
        newStatus: status,
      },
    });
  } catch (error) {
    console.error("❌ Error updating member status:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengubah status anggota",
      error: error.message,
      details: error.stack,
    });
  }
});

// Delete member using raw SQL
router.delete("/:id", async (req, res) => {
  try {
    const memberId = Number.parseInt(req.params.id);

    console.log(`🗑️ Attempting to delete member: ${memberId}`);

    // Validate member ID
    if (!memberId || isNaN(memberId)) {
      return res.status(400).json({
        message: "ID anggota tidak valid",
        receivedId: req.params.id,
      });
    }

    // First, check if the member exists
    const [members] = await db.query("SELECT * FROM members WHERE id = ?", [
      memberId,
    ]);

    if (members.length === 0) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    const member = members[0];
    console.log("Found member to delete:", member.nama);

    // Start a transaction
    await db.query("START TRANSACTION");

    try {
      // Delete from members table
      const [deleteResult] = await db.query(
        "DELETE FROM members WHERE id = ?",
        [memberId]
      );
      console.log("Delete member result:", deleteResult);

      // If there's a user_id, delete from users table
      if (member.user_id) {
        const [deleteUserResult] = await db.query(
          "DELETE FROM users WHERE id = ?",
          [member.user_id]
        );
        console.log("Delete user result:", deleteUserResult);
      }

      // Commit the transaction
      await db.query("COMMIT");
      console.log("✅ Transaction committed successfully");

      res.json({
        success: true,
        message: `Anggota ${member.nama} berhasil dihapus`,
        deletedMember: {
          id: member.id,
          nama: member.nama,
        },
      });
    } catch (error) {
      // Rollback the transaction if there's an error
      await db.query("ROLLBACK");
      console.log("❌ Transaction rolled back");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error deleting member:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus anggota",
      error: error.message,
    });
  }
});

module.exports = router;
