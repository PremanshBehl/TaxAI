import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorName: { type: String },
  gstin: { type: String },
  invoiceNumber: { type: String },
  invoiceDate: { type: String },
  dueDate: { type: String },
  totalAmount: { type: Number },
  taxAmount: { type: Number },
  
  // Flexible Fields
  accountNumber: { type: String },
  meterNumber: { type: String },
  previousBalance: { type: Number },
  currentCharges: { type: Number },
  taxesBrokenDown: { type: mongoose.Schema.Types.Mixed }, // e.g. { CGST: 10, SGST: 10 }
  invoiceItems: [{ type: mongoose.Schema.Types.Mixed }], // e.g. [{ description: 'Item 1', amount: 100 }]
  
  validationStatus: { type: String, enum: ['valid', 'warning', 'error'], default: 'warning' },
  validationErrors: [{ type: String }],
  extractedText: { type: String },
  uploadedFileUrl: { type: String },
  confidenceScore: { type: Number, default: 0 },
  fieldConfidence: { type: mongoose.Schema.Types.Mixed }, // Store individual field confidence scores
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
