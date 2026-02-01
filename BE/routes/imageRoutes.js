import express from 'express';
import multer from 'multer';
import { uploadFile, cloudinary } from '../services/imageStorage.js';

const router    = express.Router();

const storage   = multer.memoryStorage(); 
const upload    = multer({ storage });

router.post   ('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const {userId, imageType} = req.body;
    await cloudinary.uploader.destroy(`${userId}_${imageType}`);

    const result = await uploadFile(req.file.buffer, `${userId}_${imageType}`);
    // In a real app, you would process the uploaded file (e.g., save to Cloudinary)
    res.status(200).json({ 
        message: 'File uploaded successfully', 
        url: result.secure_url  
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;