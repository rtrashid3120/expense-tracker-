import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wallet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', default: null },
  trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  note: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: null },
  created_at: { type: Date, default: Date.now }
});

export const Expense = mongoose.model('Expense', expenseSchema);
