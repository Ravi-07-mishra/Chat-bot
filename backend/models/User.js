const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ["user", "assistant", "system"]
  },
  content: {
    type: String,
    required: function() {
      return !this.image; // Content not required if image is present
    }
  },
  image: {
    type: String, // Stores base64 encoded image
    required: function() {
      return !this.content; // Image not required if content is present
    },
    validate: {
      validator: function(v) {
        return /^data:image\/(jpeg|png|gif|webp);base64,/.test(v);
      },
      message: props => `${props.value} is not a valid base64 image string!`
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  validate: {
    validator: function() {
      return this.content || this.image;
    },
    message: "Message must have either content or an image"
  }
});

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    default: randomUUID,
    unique: true
  },
  title: {
    type: String,
    default: "New Conversation"
  },
  summary: {
    type: String,
    default: ""
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isNew && this.messages.length > 0) {
    const firstMessage = this.messages[0];
    this.title = firstMessage.content 
      ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? "..." : "")
      : "Image Conversation";
  }
  
  next();
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  avatar: {
    type: String,
    default: ""
  },
  conversations: [conversationSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.lastActive = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);