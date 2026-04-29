export const cleanAmount = (raw: string): number => {
  const cleanVal = raw.replace(/[^\d\.\,\-]/g, '').replace(/,/g, '.');
  const parts = cleanVal.split('.');
  if (parts.length > 1) {
    const decimal = parts.pop();
    const whole = parts.join('');
    return parseFloat(`${whole}.${decimal}`);
  }
  return parseFloat(cleanVal) || 0;
};

export const extractAmount = (text: string) => {
  const amountPatterns = [
    /total(?: amount| due| payable)?\s*[:=]?\s*(?:(?:rs|inr|₹|\$)\s*)?([\d\,\.]+\d{2})/i,
    /amount due\s*[:=]?\s*(?:(?:rs|inr|₹|\$)\s*)?([\d\,\.]+\d{2})/i,
    /net amount\s*[:=]?\s*(?:(?:rs|inr|₹|\$)\s*)?([\d\,\.]+\d{2})/i,
    /grand total\s*[:=]?\s*(?:(?:rs|inr|₹|\$)\s*)?([\d\,\.]+\d{2})/i,
    /(?:rs|inr|₹|\$)\s*([\d\,\.]+\d{2})/i, // generic currency match
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return { value: cleanAmount(match[1]), confidence: pattern.toString().includes('total') ? 95 : 70 };
    }
  }
  return null;
};

export const extractDate = (text: string) => {
  const datePatterns = [
    /\b(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})\b/i,
    /\b(\d{1,2}[\s\-\/]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\/]*\d{4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\/]*\d{1,2}[\s\-\/\,]*\d{4})\b/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return { value: match[1].replace(/\./g, '-'), confidence: 85 };
    }
  }
  return null;
};

export const extractVendor = (text: string) => {
  const lines = text.split('\n').slice(0, 10);
  const vendorPatterns = [
    /([A-Z\&a-z\s\.\,\-]+(?:PRIVATE LIMITED|PVT LTD|LTD|LLP|CORPORATION|INDUSTRIES|ENTERPRISES|INC|LLC))\b/i,
    /([A-Z\&a-z\s\.\,\-]+(?:Hospital|Clinic|Pharmacy|Telecom|Power|Electricity|Water|Board|Authority|Insurance))\b/i
  ];
  
  for (const line of lines) {
    for (const pattern of vendorPatterns) {
      const match = line.match(pattern);
      if (match) {
        let vendor = match[1].trim().split('|').pop() || '';
        vendor = vendor.replace(/^(?:name of|customer|buyer|to|m\/s|from|vendor|supplier|seller)[\s\:]*/i, '').trim();
        if (vendor.length > 3) return { value: vendor, confidence: 85 };
      }
    }
  }
  if (lines.length > 0) {
    return { value: lines[0].split('|')[0].trim(), confidence: 50 }; // Fallback
  }
  return null;
};

export const extractBillNumber = (text: string) => {
  const lines = text.split('\n');
  const invPatterns = [
    /(?:invoice no|inv no|bill no|invoice number|ref no|receipt no|statement no)\s*[:\-#|]?\s*([A-Za-z0-9\-\/]+)/i
  ];
  
  for (const line of lines) {
    for (const pattern of invPatterns) {
      const match = line.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return { value: match[1].trim(), confidence: 95 };
      }
    }
  }
  
  const loneInvRegex = /\b(INV|BILL|REC)[- ]?(\d{4,})\b/i;
  for (const line of lines) {
    const match = line.match(loneInvRegex);
    if (match) {
      return { value: match[0].trim(), confidence: 60 };
    }
  }
  return null;
};

// Orchestrates extraction
export const extractAllFields = (text: string) => {
  const fields: any = {};
  
  const vendor = extractVendor(text);
  if (vendor) fields.vendorName = vendor;
  
  const billNum = extractBillNumber(text);
  if (billNum) fields.invoiceNumber = billNum;
  
  const date = extractDate(text);
  if (date) fields.invoiceDate = date; // Also can apply dueDate logic similarly
  
  const total = extractAmount(text);
  if (total) fields.totalAmount = total;
  
  // Tax
  const taxMatch = text.match(/tax\s*amount\s*[:=]?\s*(?:(?:rs|inr|₹|\$)\s*)?([\d\,\.]+\d{2})/i);
  if (taxMatch) fields.taxAmount = { value: cleanAmount(taxMatch[1]), confidence: 80 };
  
  return fields;
};
