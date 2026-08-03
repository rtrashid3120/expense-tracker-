import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  initial_budget: { type: Number, required: true },
  balance: { type: Number, required: true },
  color: { type: String, default: '#00F0FF' },
  created_at: { type: Date, default: Date.now }
});

export const Wallet = mongoose.model('Wallet', walletSchema);
