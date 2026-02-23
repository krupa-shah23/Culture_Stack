const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    department: {
        type: String,
        required: [true, 'Please specify a department']
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    // server-side unread activity count (keeps navbar badge authoritative)
    unreadActivityCount: {
        type: Number,
        default: 0
    },
    // User settings / privacy controls (defaults kept for backward-compat)
    defaultAnonymityLevel: {
        type: Number,
        enum: [1, 2, 3],
        default: 2
    },
    visibility: {
        type: String,
        enum: ['private', 'department', 'organization'],
        default: 'organization'
    },
    allowAiFeedback: {
        type: Boolean,
        default: true
    },
    allowAnonymousComments: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);