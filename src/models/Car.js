import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  engine: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  gearbox: {
    type: String,
    required: true
  },
  tinting: {
    type: String,
    enum: ['Ha', 'Yo\'q'],
    default: 'Yo\'q'
  },
  description: {
    type: String,
    trim: true
  },
  images: {
    exterior: String,
    interior: String,
    modelType: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
carSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better performance
carSchema.index({ category: 1 });
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ price: 1 });
carSchema.index({ year: 1 });
carSchema.index({ isAvailable: 1 });
carSchema.index({ createdBy: 1 });

export default mongoose.model('Car', carSchema); 