const express = require("express");
const router = express.Router();

const {
    createBatch,
    getAllBatches,
    updateBatch,
    deleteBatch
} = require("../controllers/Batch");

const { auth, isAdmin } = require("../middleware/auth");

// Batch Routes
router.post("/create", auth, isAdmin, createBatch);
router.get("/all", auth, isAdmin, getAllBatches); // Maybe allow instructors too? Stick to Admin for now.
router.put("/update/:batchId", auth, isAdmin, updateBatch);
router.delete("/delete/:batchId", auth, isAdmin, deleteBatch);

module.exports = router;
