export type BillType = 
  | 'GST_INVOICE'
  | 'ELECTRICITY_BILL'
  | 'WATER_BILL'
  | 'TELECOM_BILL'
  | 'CREDIT_CARD'
  | 'MEDICAL_BILL'
  | 'INSURANCE'
  | 'RENT_RECEIPT'
  | 'UNKNOWN';

export const detectBillType = (text: string): { billType: BillType; confidence: number; recommendations: string[] } => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('gstin') || lowerText.includes('tax invoice')) {
    return { billType: 'GST_INVOICE', confidence: 90, recommendations: ['Validate GSTIN format', 'Ensure CGST/SGST match'] };
  }
  if (lowerText.includes('meter') || lowerText.includes('kwh') || lowerText.includes('electricity')) {
    return { billType: 'ELECTRICITY_BILL', confidence: 90, recommendations: ['Extract Meter Number', 'Check previous vs current reading'] };
  }
  if (lowerText.includes('water board') || lowerText.includes('cubic meters') || lowerText.includes('water supply')) {
    return { billType: 'WATER_BILL', confidence: 85, recommendations: ['Check consumption units'] };
  }
  if (lowerText.includes('telecom') || lowerText.includes('mobile plan') || lowerText.includes('recharge') || lowerText.includes('broadband')) {
    return { billType: 'TELECOM_BILL', confidence: 85, recommendations: ['Extract phone number/account number'] };
  }
  if (lowerText.includes('card number') || lowerText.includes('minimum amount due') || lowerText.includes('statement date')) {
    return { billType: 'CREDIT_CARD', confidence: 90, recommendations: ['Extract minimum due', 'Extract total due'] };
  }
  if (lowerText.includes('hospital') || lowerText.includes('clinic') || lowerText.includes('patient') || lowerText.includes('doctor')) {
    return { billType: 'MEDICAL_BILL', confidence: 80, recommendations: ['Check for patient name', 'Check itemized medicine list'] };
  }
  if (lowerText.includes('policy number') || lowerText.includes('premium') || lowerText.includes('insurance')) {
    return { billType: 'INSURANCE', confidence: 85, recommendations: ['Extract policy number'] };
  }
  if (lowerText.includes('rent receipt') || lowerText.includes('tenant') || lowerText.includes('landlord')) {
    return { billType: 'RENT_RECEIPT', confidence: 80, recommendations: ['Check rental period'] };
  }

  return { billType: 'UNKNOWN', confidence: 50, recommendations: ['Generic extraction applied'] };
};
