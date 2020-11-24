const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  room: String,
  creator: String,
  users: [String],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;