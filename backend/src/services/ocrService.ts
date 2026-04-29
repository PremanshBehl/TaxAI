import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imagePath: string): Promise<string> => {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m)
    });
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
};

export const parseInvoiceData = (rawText: string) => {
  // Normalize text: remove noise, extra spaces, standardise newlines
  const text = rawText
    .replace(/[^\w\s\.\,\-\/\:\₹\$\#\@\&\\]/g, ' ') // Remove weird OCR noise characters
    .replace(/\s{3,}/g, ' | ') // Replace large gaps with a delimiter
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
    .trim();

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const data: any = {
    vendorName: null,
    gstin: null,
    invoiceNumber: null,
    invoiceDate: null,
    dueDate: null,
    totalAmount: null,
    taxAmount: null,
    accountNumber: null,
    meterNumber: null,
    previousBalance: null,
    currentCharges: null,
    taxesBrokenDown: {},
    invoiceItems: [],
    confidenceScore: 0,
    fieldConfidence: {}
  };

  const setField = (field: string, value: any, confidence: number) => {
    if (!data[field] || (data.fieldConfidence[field] || 0) < confidence) {
      data[field] = value;
      data.fieldConfidence[field] = confidence;
    }
  };

  // 1. Line-based Invoice Number Extraction (try multiple variations)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const invPatterns = [/invoice[\s]*no/i, /inv[\s]*no/i, /bill[\s]*no/i, /invoice[\s]*number/i, /ref[\s]*no/i, /receipt[\s]*no/i, /statement[\s]*no/i];
    
    for (const pattern of invPatterns) {
      if (pattern.test(lower)) {
        const parts = line.split(/[:\-#|]/);
        if (parts.length > 1) {
          for (let p = 1; p < parts.length; p++) {
             const val = parts[p].trim().replace(/[^A-Za-z0-9\-\/]/g, '');
             if (val.length > 2) {
               setField('invoiceNumber', val, 95);
               break;
             }
          }
        } else {
           const match = line.match(/(?:invoice no|inv no|bill no|invoice number|ref no|receipt no|statement no)\s*([A-Za-z0-9\-\/]+)/i);
           if (match && match[1]) {
             setField('invoiceNumber', match[1], 90);
           }
        }
      }
    }
  }

  // Fallback for invoice number (regex standalone)
  if (!data.invoiceNumber) {
     const loneInvRegex = /\b(INV|BILL|REC)[- ]?(\d{4,})\b/i;
     for (let i = 0; i < lines.length; i++) {
       const match = lines[i].match(loneInvRegex);
       if (match) {
         setField('invoiceNumber', match[0], 60);
         break;
       }
     }
  }

  // 2. Line-based Date Extraction
  const dateRegexes = [
    /\b(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})\b/i,
    /\b(\d{1,2}[\s\-\/]*[A-Za-z]{3}[\s\-\/]*\d{4})\b/i,
    /\b([A-Za-z]{3}[\s\-\/]*\d{1,2}[\s\-\/\,]*\d{4})\b/i
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isDueDate = lower.includes('due') || lower.includes('pay by') || lower.includes('valid till');
    const isBillDate = lower.includes('date') || lower.includes('issued') || lower.includes('generated');

    for (const regex of dateRegexes) {
      const match = line.match(regex);
      if (match) {
        const val = match[1].replace(/\./g, '-').trim();
        if (isDueDate) {
          setField('dueDate', val, 95);
        } else if (isBillDate) {
          setField('invoiceDate', val, 90);
        } else {
           if (!data.invoiceDate) setField('invoiceDate', val, 50);
        }
      }
    }
  }

  // 3. Robust GSTIN Extraction
  const gstinRegex = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})\b/i;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const match = lines[i].match(gstinRegex);
    if (match) {
      if (lower.includes('customer') || lower.includes('buyer')) {
        // Ignore customer GSTIN for vendor field
      } else {
        setField('gstin', match[1].toUpperCase(), 95);
      }
    }
  }

  // 4. Vendor Name (Advanced isolation)
  const companyRegexes = [
    /([A-Z\&a-z\s\.\,\-]+(?:PRIVATE LIMITED|PVT LTD|LTD|LLP|CORPORATION|INDUSTRIES|ENTERPRISES|INC|LLC))\b/i,
    /([A-Z\&a-z\s\.\,\-]+(?:Hospital|Clinic|Pharmacy|Telecom|Power|Electricity|Water|Board|Authority|Insurance))\b/i
  ];
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const line = lines[i];
    for (const regex of companyRegexes) {
       const match = line.match(regex);
       if (match) {
         let vendor = match[1].trim();
         vendor = vendor.split('|').pop() || vendor;
         vendor = vendor.replace(/^(?:name of|customer|buyer|to|m\/s|from|vendor|supplier|seller)[\s\:]*/i, '').trim();
         if (vendor.length > 3) {
            setField('vendorName', vendor, 80);
            break;
         }
       }
    }
  }

  // Fallback Vendor Name (first line often contains it)
  if (!data.vendorName && lines.length > 0) {
    setField('vendorName', lines[0].split('|')[0].trim(), 40);
  }

  // 5. Money Regex - Amounts
  const allAmounts: { val: number, lineIndex: number, lineLower: string }[] = [];
  const moneyRegex = /(\d+(?:,\d{2,3})*[\.\,]\s*\d{2})\b/g;
  for (let i = 0; i < lines.length; i++) {
    let m;
    while ((m = moneyRegex.exec(lines[i])) !== null) {
      const cleanVal = m[1].replace(/\s/g, '').replace(/,/g, '.');
      const parts = cleanVal.split('.');
      let val = 0;
      if (parts.length > 1) {
        const decimal = parts.pop();
        const whole = parts.join('');
        val = parseFloat(`${whole}.${decimal}`);
      } else {
        val = parseFloat(cleanVal);
      }
      if (!isNaN(val)) allAmounts.push({ val, lineIndex: i, lineLower: lines[i].toLowerCase() });
    }
  }

  // Extract Total Amount, Tax, Previous Balance, Current Charges
  let maxAmount = 0;
  for (const amt of allAmounts) {
    if (amt.val > maxAmount) maxAmount = amt.val;

    if (amt.lineLower.includes('total') || amt.lineLower.includes('amount due') || amt.lineLower.includes('net amount') || amt.lineLower.includes('grand total') || amt.lineLower.includes('payable')) {
      setField('totalAmount', amt.val, 90);
    }
    if (amt.lineLower.includes('tax') || amt.lineLower.includes('gst') || amt.lineLower.includes('vat')) {
       if (!data.taxAmount || data.taxAmount < amt.val) setField('taxAmount', amt.val, 85);
       if (amt.lineLower.includes('cgst')) data.taxesBrokenDown.CGST = amt.val;
       if (amt.lineLower.includes('sgst')) data.taxesBrokenDown.SGST = amt.val;
       if (amt.lineLower.includes('igst')) data.taxesBrokenDown.IGST = amt.val;
    }
    if (amt.lineLower.includes('previous balance') || amt.lineLower.includes('arrears') || amt.lineLower.includes('last payment')) {
       setField('previousBalance', amt.val, 90);
    }
    if (amt.lineLower.includes('current charges') || amt.lineLower.includes('current bill') || amt.lineLower.includes('this month')) {
       setField('currentCharges', amt.val, 90);
    }
  }

  if (!data.totalAmount && maxAmount > 0) {
    setField('totalAmount', maxAmount, 60); // heuristic: max amount is usually total
  }

  // 6. Account Number / Meter Number
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    if (lower.includes('account no') || lower.includes('a/c no') || lower.includes('account number') || lower.includes('contract no')) {
       const match = line.match(/([0-9A-Z\-\/]{6,15})/i);
       if (match) setField('accountNumber', match[1].trim(), 90);
    }
    if (lower.includes('meter no') || lower.includes('meter number') || lower.includes('consumer no')) {
       const match = line.match(/([0-9A-Z\-\/]{5,15})/i);
       if (match) setField('meterNumber', match[1].trim(), 90);
    }
  }

  // Overall Confidence Score Calculation
  const requiredFields = ['vendorName', 'invoiceNumber', 'invoiceDate', 'totalAmount'];
  let confSum = 0;
  let confCount = 0;
  for (const f of requiredFields) {
    if (data[f]) {
      confSum += (data.fieldConfidence[f] || 0);
    }
    confCount++;
  }
  
  const flexFields = ['dueDate', 'taxAmount', 'accountNumber', 'meterNumber', 'previousBalance', 'currentCharges'];
  for (const f of flexFields) {
    if (data[f]) {
      confSum += (data.fieldConfidence[f] || 0);
      confCount++;
    }
  }
  
  data.confidenceScore = confCount > 0 ? Math.round(confSum / confCount) : 0;
  
  return data;
};
