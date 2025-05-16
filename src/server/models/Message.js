const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    startup: {
      type: Schema.Types.ObjectId,
      ref: 'startup'
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    },
    messageType: {
      type: String,
      enum: ['direct', 'startup'],
      required: true
    }
  },
  { timestamps: true }
);

// Validate that direct messages have a recipient and startup messages have a startup
MessageSchema.pre('save', function(next) {
  if (this.messageType === 'direct' && !this.recipient) {
    return next(new Error('Direct messages must have a recipient'));
  }
  
  if (this.messageType === 'startup' && !this.startup) {
    return next(new Error('Startup messages must have a startup'));
  }
  
  next();
});

// Indexes for faster querying
MessageSchema.index({ sender: 1, recipient: 1 });
MessageSchema.index({ startup: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('message', MessageSchema); 