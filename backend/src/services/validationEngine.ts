import { BillType } from './billTypeDetector';
import { calculateOverallConfidence } from './confidenceScorer';

export const validateFormat = (fields: any, errors: string[], warnings: string[]) => {
  if (fields.totalAmount && fields.totalAmount.value <= 0) {
    errors.push('Total amount must be greater than 0');
  }
  if (fields.invoiceNumber && fields.invoiceNumber.value.length < 3) {
    errors.push('Bill number must be at least 3 characters');
  }
  if (!fields.vendorName) {
    warnings.push('Vendor name not found');
  }
};

export const validateLogic = (fields: any, errors: string[], warnings: string[]) => {
  if (fields.taxAmount && fields.totalAmount) {
    if (fields.taxAmount.value > fields.totalAmount.value) {
      errors.push('Tax amount cannot be greater than Total amount');
    }
    if (fields.taxAmount.value > (fields.totalAmount.value * 0.5)) {
      warnings.push('Tax amount is suspiciously high (>50% of total)');
    }
  }
};

export const validateCompliance = (fields: any, billType: BillType, errors: string[], warnings: string[]) => {
  if (billType === 'GST_INVOICE' && !fields.gstin) {
    warnings.push('GSTIN missing for GST Invoice');
  }
};

export const validateBill = (fields: any, billType: BillType) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  validateFormat(fields, errors, warnings);
  validateLogic(fields, errors, warnings);
  validateCompliance(fields, billType, errors, warnings);

  const confidence = calculateOverallConfidence(fields);

  let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
  let userAction: 'REVIEW' | 'APPROVE' | 'EDIT' = 'APPROVE';

  if (errors.length > 0) {
    status = 'FAILED';
    userAction = 'EDIT';
  } else if (warnings.length > 0 || confidence < 80) {
    status = 'PARTIAL';
    userAction = 'REVIEW';
  }

  // Graceful degradation handling
  if (!fields.totalAmount) {
    fields.totalAmount = { value: 0, confidence: 0 };
    warnings.push('Amount missing: Set to 0, needs review');
    status = 'PARTIAL';
    userAction = 'REVIEW';
  }
  
  if (!fields.vendorName) {
    fields.vendorName = { value: 'Unknown Vendor', confidence: 0 };
    status = 'PARTIAL';
  }

  return { status, errors, warnings, suggestions, confidence, userAction };
};
