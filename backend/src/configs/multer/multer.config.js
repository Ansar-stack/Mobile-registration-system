import multer from 'multer';
import { uploadImage, FOLDERS } from '../../utils/cloudinary.util.js';

const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (imageMimeTypes.includes(file.mimetype)) return cb(null, true);
  cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});

const getUploadOptions = (fieldname) => {
  switch (fieldname) {
    case 'idImage': return { folder: FOLDERS.ID_IMAGE, type: 'upload' };
    default:        return { folder: FOLDERS.PROFILE,  type: 'upload' };
  }
};

export const processUploadedImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const { folder, type } = getUploadOptions(req.file.fieldname);
    const result = await uploadImage(req.file.buffer, folder, type);
    req.file.secure_url = result.secure_url;
    req.file.public_id  = result.public_id;
    next();
  } catch (error) {
    next(error);
  }
};
