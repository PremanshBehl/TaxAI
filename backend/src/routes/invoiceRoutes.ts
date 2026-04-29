import express from 'express';
import multer from 'multer';
import { uploadInvoice, getInvoices, getInvoiceById, getDashboardStats, deleteInvoice, updateInvoice } from '../controllers/invoiceController';
import { protect } from '../middleware/auth';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPG or PNG.'), false);
  }
};

const upload = multer({ storage, fileFilter });
router.post('/upload', protect, upload.single('invoice'), uploadInvoice);
router.get('/', protect, getInvoices);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getInvoiceById);
router.put('/:id', protect, updateInvoice);
router.delete('/:id', protect, deleteInvoice);

export default router;
