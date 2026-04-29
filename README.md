# AI Invoice Validator & GST Compliance Checker

An enterprise-style mini SaaS platform for automated invoice validation and GST compliance checking using OCR and AI.

## Architecture

This application consists of two main parts:
1. **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Lucide React
2. **Backend**: Node.js, Express.js, TypeScript, MongoDB, Tesseract.js (OCR)

## Features

- **JWT Authentication**: Secure login and registration.
- **Invoice Upload**: Drag-and-drop file upload for invoices (Images/PDFs).
- **OCR Extraction**: Uses Tesseract.js to extract text from uploaded images.
- **Data Parsing**: Extracts GSTIN, Invoice Number, Date, Total Amount, and Tax Amount from raw OCR text.
- **GST Compliance**: Validates GSTIN format and checks for missing critical fields (Tax amount, Total amount).
- **Dashboard Analytics**: Visualize invoice data, compliance status, and processing volume.
- **Dark Mode UI**: Modern SaaS-style dashboard using Tailwind CSS.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
# Ensure you have a .env file based on the provided configuration.
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Deployment
- **Frontend**: Designed to be deployed on Vercel. Run `npm run build` to generate the production build.
- **Backend**: Can be deployed on Render or Railway. Set environment variables `MONGODB_URI` and `JWT_SECRET` accordingly.

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Express + Mongoose + TypeScript
- OCR: Tesseract.js
- Styling: Lucide React + TailwindCSS + class-variance-authority
