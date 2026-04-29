import { extractAllFields } from './multiRegexExtractor';
import { detectBillType } from './billTypeDetector';
import { validateBill } from './validationEngine';

export const parseUniversalBill = (rawText: string) => {
  const startTime = Date.now();
  
  // Normalize text: remove noise, extra spaces, standardise newlines
  const text = rawText
    .replace(/[^\w\s\.\,\-\/\:\₹\$\#\@\&\\]/g, ' ') // Remove weird OCR noise characters
    .replace(/\s{3,}/g, ' | ') // Replace large gaps with a delimiter
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
    .trim();

  // 1. Detect Bill Type
  const { billType, confidence: typeConfidence, recommendations } = detectBillType(text);

  // 2. Extract Fields (Universal extraction)
  // In a full implementation, this could take billType into account for customized patterns
  const extractedFields = extractAllFields(text);
  
  // 3. Validation & Confidence Scoring
  const { status, errors, warnings, suggestions, confidence, userAction } = validateBill(extractedFields, billType);

  const processingTime = Date.now() - startTime;
  
  // Document quality logic based on overall confidence
  let documentQuality = 'MEDIUM';
  if (confidence > 85) documentQuality = 'HIGH';
  if (confidence < 60) documentQuality = 'LOW';

  // Format the output exactly as requested
  return {
    status,
    confidence,
    billType,
    extractedFields,
    validation: {
      errors,
      warnings,
      suggestions: [...suggestions, ...recommendations]
    },
    userAction,
    rawOCRText: rawText,
    metadata: {
      uploadedAt: new Date().toISOString(),
      processingTime,
      documentQuality
    }
  };
};
