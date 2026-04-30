import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, FileText, FileJson } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const InvoiceDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoice(response.data);
        setEditData(response.data);
      } catch (error) {
        toast.error('Failed to load invoice details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token && id) fetchInvoice();
  }, [id, token]);

  const handleSave = async () => {
    try {
      const response = await axios.put(`http://localhost:5001/api/invoices/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(response.data);
      setIsEditing(false);
      toast.success('Invoice updated successfully');
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `invoice-${invoice.invoiceNumber || id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading || !invoice) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded w-1/4"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[600px] bg-muted rounded-2xl"></div>
        <div className="h-[600px] bg-muted rounded-2xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/invoices" className="p-2 bg-card border border-border/50 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.invoiceNumber || 'Unknown'}</h1>
            <p className="text-muted-foreground text-sm">{invoice.vendorName || 'Unknown Vendor'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button onClick={() => { setIsEditing(false); setEditData(invoice); }} className="px-4 py-2 border border-border/50 bg-card rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-border/50 bg-card rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Edit Fields
              </button>
              <button onClick={handleExportJson} className="flex items-center gap-2 px-4 py-2 border border-border/50 bg-card rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                <FileJson className="h-4 w-4" /> Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden flex flex-col h-[800px]">
          <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Original Document
            </h3>
          </div>
          <div className="flex-1 bg-muted/10 p-6 flex items-center justify-center">
            {invoice.uploadedFileUrl ? (
              <img 
                src={`http://localhost:5001/${invoice.uploadedFileUrl}`} 
                alt="Invoice" 
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-border/50"
              />
            ) : (
              <div className="text-muted-foreground">No image available</div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col h-[800px]">
          <div className="bg-card border border-border/50 rounded-2xl p-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Extracted Data</h3>
              <div className="flex gap-2 items-center">
                <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${invoice.confidenceScore >= 80 ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  Overall Confidence: {invoice.confidenceScore || 0}%
                </span>
                {invoice.validationStatus === 'valid' ? (
                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500"><CheckCircle2 className="h-4 w-4" /> Compliant</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500"><AlertTriangle className="h-4 w-4" /> Validation Warning</span>
                )}
              </div>
            </div>

            {invoice.confidenceScore < 60 && (
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-500 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Low Confidence Extraction
                </h4>
                <p className="text-sm text-orange-600/80 dark:text-orange-500/90">
                  The AI had trouble reading this document accurately. Please review the extracted fields carefully.
                </p>
              </div>
            )}

            {invoice.validationErrors?.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-500 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Compliance Issues Detected
                </h4>
                <ul className="text-sm text-yellow-600/80 dark:text-yellow-500/90 list-disc list-inside space-y-1">
                  {invoice.validationErrors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {[
                { key: 'vendorName', label: 'Vendor Name', type: 'text' },
                { key: 'gstin', label: 'GSTIN', type: 'text', isMono: true },
                { key: 'invoiceNumber', label: 'Bill / Invoice Number', type: 'text' },
                { key: 'invoiceDate', label: 'Issue Date', type: 'text' },
                { key: 'dueDate', label: 'Due Date', type: 'text' },
                { key: 'accountNumber', label: 'Account Number', type: 'text' },
                { key: 'meterNumber', label: 'Meter Number', type: 'text' },
                { key: 'previousBalance', label: 'Previous Balance', type: 'number', isCurrency: true },
                { key: 'currentCharges', label: 'Current Charges', type: 'number', isCurrency: true },
                { key: 'totalAmount', label: 'Total Amount', type: 'number', isCurrency: true },
                { key: 'taxAmount', label: 'Tax Amount', type: 'number', isCurrency: true },
              ].map(field => {
                 // only show if not null, or if editing
                 if (!isEditing && invoice[field.key] == null) return null;

                 const conf = invoice.fieldConfidence?.[field.key] || 0;
                 const confColor = conf >= 80 ? 'text-green-500' : conf >= 60 ? 'text-yellow-500' : 'text-red-500';

                 return (
                  <div key={field.key}>
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm text-muted-foreground">{field.label}</p>
                      {!isEditing && conf > 0 && <span className={`text-[10px] font-bold ${confColor}`}>{conf}%</span>}
                    </div>
                    {isEditing ? (
                      <input 
                        type={field.type === 'number' ? 'number' : 'text'} 
                        step={field.type === 'number' ? '0.01' : undefined}
                        value={editData[field.key] || ''} 
                        onChange={e => setEditData({...editData, [field.key]: field.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value})} 
                        className={`w-full bg-background border border-border/50 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary ${field.isMono ? 'font-mono' : ''}`} 
                      />
                    ) : (
                      <p className={`font-medium ${field.isMono ? 'font-mono bg-muted/50 inline-block px-2 py-0.5 rounded' : field.isCurrency ? 'text-lg' : ''}`}>
                         {field.isCurrency ? `$${(invoice[field.key] || 0).toFixed(2)}` : (invoice[field.key] || 'N/A')}
                      </p>
                    )}
                  </div>
                 );
              })}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl flex-[0.4] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold text-sm">Raw OCR Text</h3>
            </div>
            <div className="flex-1 p-4 bg-black/40 overflow-auto font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {invoice.extractedText || 'No text extracted'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
