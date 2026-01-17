const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role");

router.get("/", roleController.getAllRoles);
router.get("/:id", roleController.getOneRole);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
