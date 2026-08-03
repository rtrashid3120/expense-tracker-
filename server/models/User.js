import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  full_name: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  short_id: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
