export const validateGSTCompliance = (invoiceData: any) => {
  const errors: string[] = [];
  let status = 'valid';

  // 1. Check GSTIN Format
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!invoiceData.gstin) {
    errors.push('Missing GSTIN (Not applicable for non-GST bills)');
    if (status !== 'error') status = 'warning';
  } else if (!gstinRegex.test(invoiceData.gstin)) {
    errors.push('Invalid GSTIN format');
    status = 'error';
  }

  // 2. Missing Invoice Number
  if (!invoiceData.invoiceNumber) {
    errors.push('Missing Invoice Number');
    if (status !== 'error') status = 'warning';
  }

  // 3. Missing Date
  if (!invoiceData.invoiceDate) {
    errors.push('Missing Invoice Date');
    if (status !== 'error') status = 'warning';
  }

  // 4. Missing Amounts
  if (!invoiceData.totalAmount) {
    errors.push('Missing Total Amount');
    status = 'error';
  }
  
  if (!invoiceData.taxAmount && invoiceData.totalAmount) {
    errors.push('Missing Tax Amount or Tax not detected');
    if (status !== 'error') status = 'warning';
  }

  // 5. Math validation (Basic)
  // E.g. Tax shouldn't be more than total
  if (invoiceData.taxAmount && invoiceData.totalAmount) {
    if (invoiceData.taxAmount > invoiceData.totalAmount) {
      errors.push('Tax amount cannot be greater than Total amount');
      status = 'error';
    }
  }

  return { status, errors };
};
