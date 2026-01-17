const express = require("express");
const router = express.Router();
const divisiController = require("../controllers/divisi");

router.get("/", divisiController.getAllDivisi);
router.get("/:id", divisiController.getOneDivisi);
router.post("/", divisiController.createDivisi);
router.put("/:id", divisiController.updateDivisi);
router.delete("/:id", divisiController.deleteDivisi);

module.exports = router;
