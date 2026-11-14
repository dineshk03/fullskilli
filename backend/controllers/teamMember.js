const mongoose = require('mongoose');
const TeamMember = require('../models/teamMember');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;

  return defaultValue;
};

const parseNumber = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
};

const normalizeOrders = async () => {
  const members = await TeamMember.find({}).sort({ order: 1, createdAt: 1 }).select('_id order createdAt');

  let hasChanges = false;
  const bulkOps = [];

  members.forEach((m, idx) => {
    const nextOrder = idx + 1;
    if (Number(m.order || 0) !== nextOrder) {
      hasChanges = true;
      bulkOps.push({
        updateOne: {
          filter: { _id: m._id },
          update: { $set: { order: nextOrder } },
        },
      });
    }
  });

  if (hasChanges && bulkOps.length > 0) {
    await TeamMember.bulkWrite(bulkOps);
  }
};

exports.getPublicTeamMembers = async (req, res) => {
  try {
    await normalizeOrders();
    const members = await TeamMember.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message,
    });
  }
};

exports.getAllTeamMembersAdmin = async (req, res) => {
  try {
    await normalizeOrders();
    const members = await TeamMember.find({}).sort({ order: 1, createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message,
    });
  }
};

exports.createTeamMember = async (req, res) => {
  try {
    await normalizeOrders();
    const { name, title, description } = req.body;
    const order = parseNumber(req.body?.order, 1);
    const isActive = parseBoolean(req.body?.isActive, true);
    const uploadedImage = req.file?.location;
    const image = uploadedImage || req.body?.image;

    if (!name || !title || !description || !image) {
      return res.status(400).json({
        success: false,
        message: 'name, title, description, and image are required',
      });
    }

    // Prevent duplicate ordering: shift down all members with order >= new order
    await TeamMember.updateMany({ order: { $gte: order } }, { $inc: { order: 1 } });

    const member = await TeamMember.create({
      name,
      title,
      description,
      image,
      order,
      isActive,
    });

    await normalizeOrders();

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create team member',
      error: error.message,
    });
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    await normalizeOrders();
    const { memberId } = req.params;

    if (!memberId || !isValidObjectId(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team member id',
      });
    }

    const { name, title, description } = req.body;
    const nextOrder = req.body?.order !== undefined ? parseNumber(req.body.order, 1) : undefined;
    const nextIsActive = req.body?.isActive !== undefined ? parseBoolean(req.body.isActive, true) : undefined;
    const uploadedImage = req.file?.location;
    const image = uploadedImage || req.body?.image;

    const existing = await TeamMember.findById(memberId).select('order');
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    // If order is being changed, shift surrounding items to keep unique ordering
    if (nextOrder !== undefined && nextOrder !== existing.order) {
      const currentOrder = parseNumber(existing.order, 0);

      if (nextOrder < currentOrder) {
        // Moving up: push down items in [nextOrder, currentOrder-1]
        await TeamMember.updateMany(
          { _id: { $ne: existing._id }, order: { $gte: nextOrder, $lt: currentOrder } },
          { $inc: { order: 1 } }
        );
      } else {
        // Moving down: pull up items in (currentOrder, nextOrder]
        await TeamMember.updateMany(
          { _id: { $ne: existing._id }, order: { $gt: currentOrder, $lte: nextOrder } },
          { $inc: { order: -1 } }
        );
      }
    }

    const update = {};
    if (name !== undefined) update.name = name;
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (image !== undefined) update.image = image;
    if (nextOrder !== undefined) update.order = nextOrder;
    if (nextIsActive !== undefined) update.isActive = nextIsActive;

    const updated = await TeamMember.findByIdAndUpdate(memberId, update, { new: true });

    await normalizeOrders();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update team member',
      error: error.message,
    });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId || !isValidObjectId(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team member id',
      });
    }

    const deleted = await TeamMember.findByIdAndDelete(memberId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Team member deleted',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete team member',
      error: error.message,
    });
  }
};
