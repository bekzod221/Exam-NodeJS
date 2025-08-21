import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../public/assets/images/cars');
const tempDir = path.join(__dirname, '../../public/assets/images/temp');

[uploadDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari qabul qilinadi!'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Process and optimize uploaded images
export const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedImages = {};

    for (const file of req.files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const outputPath = path.join(uploadDir, filename);

      // Process image with sharp
      await sharp(file.path)
        .resize(800, 600, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Create thumbnail
      const thumbnailFilename = `thumb-${filename}`;
      const thumbnailPath = path.join(uploadDir, thumbnailFilename);
      
      await sharp(file.path)
        .resize(300, 200, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 70 })
        .toFile(thumbnailPath);

      // Store processed image info
      processedImages[file.fieldname] = {
        original: `/assets/images/cars/${filename}`,
        thumbnail: `/assets/images/cars/${thumbnailFilename}`
      };

      // Remove temporary file
      fs.unlinkSync(file.path);
    }

    req.processedImages = processedImages;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Rasm qayta ishlashda xatolik yuz berdi'
    });
  }
};

// Middleware for single image upload
export const uploadSingle = (fieldName) => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) {
        return next();
      }

      try {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(req.file.path)
          .resize(800, 600, { 
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 80 })
          .toFile(outputPath);

        // Create thumbnail
        const thumbnailFilename = `thumb-${filename}`;
        const thumbnailPath = path.join(uploadDir, thumbnailFilename);
        
        await sharp(req.file.path)
          .resize(300, 200, { 
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 70 })
          .toFile(thumbnailPath);

        req.processedImage = {
          original: `/assets/images/cars/${filename}`,
          thumbnail: `/assets/images/cars/${thumbnailFilename}`
        };

        // Remove temporary file
        fs.unlinkSync(req.file.path);
        next();
      } catch (error) {
        console.error('Image processing error:', error);
        res.status(500).json({
          success: false,
          message: 'Rasm qayta ishlashda xatolik yuz berdi'
        });
      }
    }
  ];
};

// Middleware for multiple image upload
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return [
    upload.array(fieldName, maxCount),
    processImages
  ];
};
