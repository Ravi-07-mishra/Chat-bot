const mongoose = require('mongoose');
const { randomUUID } = require('crypto');  // Correct import

const chatSchema = new mongoose.Schema({
    id: {
        type: String,
        default: randomUUID,  // Correct usage of randomUUID()
    },
    role: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    chats: [chatSchema],
});

module.exports = mongoose.model('User', userSchema);
