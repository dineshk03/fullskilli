const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            unique: true,
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        accountType: {
            type: String,
            enum: ['Admin', 'Instructor', 'Student'],
            required: true
        },
        active: {
            type: Boolean,
            default: true,
        },
        approved: {
            type: Boolean,
            default: true,
        },
        additionalDetails: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
            required: true
        },
        courses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            }
        ],
        image: {
            type: String,
            required: true
        },
        token: {
            type: String
        },
        resetPasswordTokenExpires: {
            type: Date
        },
        courseProgress: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CourseProgress'

            }
        ],
        watchTime: {
            type: Map,
            of: Number,
            default: new Map()
        },
        createdVia: {
            type: String,
            enum: ['direct', 'php_website', 'google', 'linkedin', 'facebook', 'bulk_upload'],
            default: 'direct'
        },
        pid: {
            type: String,
            default: null
        },
        groupName: {
            type: String,
            default: null,
            trim: true
        },
        groups: {
            type: [String],
            default: [],
            trim: true
        },
        batches: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Batch'
        }]
    },// Add timestamps for when the document is created and last modified
    { timestamps: true }
);


module.exports = mongoose.models.User || mongoose.model('User', userSchema);