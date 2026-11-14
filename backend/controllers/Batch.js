const Batch = require("../models/Batch");
const User = require("../models/user");

// Create a new batch
exports.createBatch = async (req, res) => {
    try {
        const { name, description, startDate } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Batch name is required",
            });
        }

        const existingBatch = await Batch.findOne({ name: name });
        if (existingBatch) {
            return res.status(400).json({
                success: false,
                message: "Batch with this name already exists",
            });
        }

        const batch = await Batch.create({
            name,
            description,
            startDate: startDate || Date.now()
        });

        return res.status(201).json({
            success: true,
            data: batch,
            message: "Batch created successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create batch",
            error: error.message,
        });
    }
};

// Get all batches
exports.getAllBatches = async (req, res) => {
    try {
        const batches = await Batch.find().sort({ createdAt: -1 });

        // Optional: Include student count for each batch
        // This might be expensive if many users, keeping it simple for now
        // or we can aggregate. Let's do a simple count enhancement.

        const batchesWithCount = await Promise.all(batches.map(async (batch) => {
            const count = await User.countDocuments({ batches: batch._id });
            return {
                ...batch.toObject(),
                studentCount: count
            };
        }));

        return res.status(200).json({
            success: true,
            data: batchesWithCount,
            message: "Batches fetched successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch batches",
            error: error.message,
        });
    }
};

// Update batch
exports.updateBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { name, description, active } = req.body;

        const batch = await Batch.findByIdAndUpdate(
            batchId,
            { name, description, active },
            { new: true }
        );

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: batch,
            message: "Batch updated successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update batch",
            error: error.message,
        });
    }
};

// Delete batch
exports.deleteBatch = async (req, res) => {
    try {
        const { batchId } = req.params;

        // Check if logic exists to prevent deleting batch with students
        const studentsInBatch = await User.countDocuments({ batches: batchId });
        if (studentsInBatch > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete batch with ${studentsInBatch} active students. Remove students first.`,
            });
        }

        await Batch.findByIdAndDelete(batchId);

        return res.status(200).json({
            success: true,
            message: "Batch deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete batch",
            error: error.message,
        });
    }
};
