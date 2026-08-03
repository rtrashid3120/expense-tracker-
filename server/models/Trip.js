import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  total_budget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  group_size: { type: Number, default: 1 },
  image: { type: String, default: '' },
  balances: [{
    userId: { type: String, required: true },
    balance: { type: Number, default: 0 }
  }],
  created_at: { type: Date, default: Date.now }
});

export const Trip = mongoose.model('Trip', tripSchema);
