import express from 'express';
import multer from 'multer';
import { analyzeResume, rewriteResume } from '../controllers/reviewController.js';

const router = express.Router();

// Configure multer to store file in memory buffer (no local disk saving needed)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
}); 

router.post('/analyze', upload.single('resume'), analyzeResume);
router.post('/rewrite', upload.single('resume'), rewriteResume);

export default router;

