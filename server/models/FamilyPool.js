import mongoose from 'mongoose';

const familyPoolSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  total_budget: { type: Number, required: true },
  color: { type: String, default: '#00F0FF' },
  members: [{
    name: { type: String, required: true },
    role: { type: String, default: 'Member' },
    allowance: { type: Number, default: 0 }
  }],
  created_at: { type: Date, default: Date.now }
});

export const FamilyPool = mongoose.model('FamilyPool', familyPoolSchema);
