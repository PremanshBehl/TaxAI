import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { extractTextFromImage } from '../services/ocrService';
import { validateBill } from '../services/validationEngine';
import { parseUniversalBill } from '../services/billParser';
import { detectBillType } from '../services/billTypeDetector';

export const uploadInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Extract text via OCR
    const extractedText = await extractTextFromImage(req.file.path);
    
    // Parse using Universal Bill Parser
    const parserResult = parseUniversalBill(extractedText);

    // Save to Database mapping the new nested structure back to the flat model (or save the full JSON)
    const dbPayload = {
      userId: (req as any).user._id,
      vendorName: parserResult.extractedFields.vendorName?.value,
      invoiceNumber: parserResult.extractedFields.invoiceNumber?.value,
      invoiceDate: parserResult.extractedFields.invoiceDate?.value,
      dueDate: parserResult.extractedFields.dueDate?.value,
      totalAmount: parserResult.extractedFields.totalAmount?.value,
      taxAmount: parserResult.extractedFields.taxAmount?.value,
      accountNumber: parserResult.extractedFields.accountNumber?.value,
      meterNumber: parserResult.extractedFields.meterNumber?.value,
      previousBalance: parserResult.extractedFields.previousBalance?.value,
      currentCharges: parserResult.extractedFields.currentCharges?.value,
      validationStatus: (parserResult.status === 'SUCCESS' ? 'valid' : parserResult.status === 'PARTIAL' ? 'warning' : 'error') as 'valid' | 'warning' | 'error',
      validationErrors: parserResult.validation.errors,
      extractedText: parserResult.rawOCRText,
      uploadedFileUrl: req.file.path,
      confidenceScore: parserResult.confidence,
      fieldConfidence: {
         vendorName: parserResult.extractedFields.vendorName?.confidence || 0,
         invoiceNumber: parserResult.extractedFields.invoiceNumber?.confidence || 0,
         invoiceDate: parserResult.extractedFields.invoiceDate?.confidence || 0,
         totalAmount: parserResult.extractedFields.totalAmount?.confidence || 0,
         taxAmount: parserResult.extractedFields.taxAmount?.confidence || 0,
      }
    };

    const invoice = await Invoice.create(dbPayload);

    // Return the EXACT response structure requested
    res.status(201).json({
      invoiceId: invoice._id,
      ...parserResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ userId: (req as any).user._id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: (req as any).user._id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    
    // Total invoices
    const total = await Invoice.countDocuments({ userId });
    
    // Valid and Invalid
    const valid = await Invoice.countDocuments({ userId, validationStatus: 'valid' });
    const invalid = await Invoice.countDocuments({ userId, validationStatus: { $ne: 'valid' } });
    
    // Total Amount
    const invoices = await Invoice.find({ userId });
    const totalAmount = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    
    // Recent invoices
    const recentActivity = await Invoice.find({ userId }).sort({ createdAt: -1 }).limit(5);
    
    // Mocking chart data based on real data for simplicity, but aggregating by date is better.
    // Let's do a simple aggregation by day
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => {
      const dayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
        return invDate === date;
      });
      return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        valid: dayInvoices.filter(i => i.validationStatus === 'valid').length,
        invalid: dayInvoices.filter(i => i.validationStatus !== 'valid').length,
      };
    });

    res.json({
      stats: { total, valid, invalid, totalAmount },
      recentActivity,
      chartData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: (req as any).user._id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { 
      vendorName, gstin, invoiceNumber, invoiceDate, dueDate, totalAmount, taxAmount,
      accountNumber, meterNumber, previousBalance, currentCharges
    } = req.body;
    
    // Re-validate Compliance based on updated fields (Universal Validation)
    // We recreate a pseudo extractedFields object for the validator
    const simulatedFields = {
      vendorName: { value: vendorName, confidence: 100 },
      gstin: { value: gstin, confidence: 100 },
      invoiceNumber: { value: invoiceNumber, confidence: 100 },
      invoiceDate: { value: invoiceDate, confidence: 100 },
      dueDate: { value: dueDate, confidence: 100 },
      totalAmount: { value: totalAmount, confidence: 100 },
      taxAmount: { value: taxAmount, confidence: 100 },
    };
    const { billType } = detectBillType(vendorName + ' ' + invoiceNumber); // Dummy text for type detection if needed, or default to unknown
    const { status, errors } = validateBill(simulatedFields, billType);

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).user._id },
      { 
        vendorName, gstin, invoiceNumber, invoiceDate, dueDate, totalAmount, taxAmount,
        accountNumber, meterNumber, previousBalance, currentCharges,
        validationStatus: (status === 'SUCCESS' ? 'valid' : status === 'PARTIAL' ? 'warning' : 'error') as 'valid' | 'warning' | 'error',
        validationErrors: errors,
        confidenceScore: 100 // Manual correction implies 100% confidence
      },
      { new: true }
    );
    
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
