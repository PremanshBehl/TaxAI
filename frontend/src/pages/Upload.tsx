import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxFiles: 1
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
  };

  const { token } = useAuth();

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('invoice', file);

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await axios.post('http://localhost:5001/api/invoices/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      clearInterval(interval);
      setProgress(100);
      
      toast.success('Bill uploaded and processed successfully!');
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setProgress(0);
        navigate(`/invoices/${response.data.invoiceId}`);
      }, 1000);
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Bill / Invoice</h1>
        <p className="text-muted-foreground mt-2">Upload ANY bill (Electricity, Medical, GST, Rent, etc.) for universal extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out flex flex-col items-center justify-center min-h-[400px]
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
              ${file ? 'border-primary/50 bg-primary/5' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="w-full relative group">
                <button 
                  onClick={clearFile}
                  className="absolute -top-4 -right-4 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-[300px] mx-auto rounded-lg shadow-lg" />
                ) : (
                  <div className="flex flex-col items-center">
                    <File className="h-24 w-24 text-primary/50 mb-4" />
                    <p className="text-xl font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <UploadCloud className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drag & drop your bill here</h3>
                <p className="text-muted-foreground mb-6">Supports PDF, JPG, PNG (Max 10MB)</p>
                <button className="bg-secondary text-secondary-foreground px-6 py-2 rounded-full font-medium text-sm hover:bg-secondary/80 transition-colors">
                  Browse Files
                </button>
              </>
            )}
          </div>

          {file && (
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><UploadCloud className="h-4 w-4" /> Extract Data</>
                  )}
                </button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Universal OCR AI Engine extracting fields...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> Supported Fields (Universal)
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Vendor/Provider Name</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Bill Number / Invoice No</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Dates (Issue & Due Date)</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Total Amount & Tax Amount</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Account & Meter Numbers</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Previous & Current Balances</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5" /> Best Results
            </h3>
            <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80 leading-relaxed">
              Our Universal AI engine automatically detects the bill type (Electricity, Medical, etc.). Ensure text is legible for &gt;90% extraction confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
