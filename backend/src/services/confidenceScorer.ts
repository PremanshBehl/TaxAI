export const scoreField = (patternStrength: number, stringLength: number, contextMatch: boolean): number => {
  let score = patternStrength;
  if (contextMatch) score += 20;
  if (stringLength > 2) score += 10;
  return Math.min(score, 100);
};

export const calculateOverallConfidence = (extractedFields: any): number => {
  const weights: any = {
    totalAmount: 0.30,
    vendorName: 0.25,
    invoiceNumber: 0.20,
    invoiceDate: 0.15,
    taxAmount: 0.10,
  };
  
  let score = 0;
  let weightSum = 0;
  for (const [field, weight] of Object.entries(weights)) {
    if (extractedFields[field]) {
       score += (extractedFields[field].confidence * (weight as number));
       weightSum += (weight as number);
    }
  }
  
  if (weightSum === 0) return 0;
  return Math.round(score / weightSum);
};
