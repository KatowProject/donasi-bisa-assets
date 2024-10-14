import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port: any = process.env.PORT || 5000;
const destFile: string = process.env.DEST_FILE || 'uploads/';

const upload = multer({
    dest: destFile,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Please upload an image'));
        }
        cb(null, true);
    }
});




app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Path List',
        endpoints: [
            '/api/upload',
            '/api/download',
            '/api/delete'
        ]
    })
});

app.post('/api/upload', upload.single('file'), (req: Request, res: Response): any => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // get extension of file
    const ext = req.file.originalname.split('.').pop();
    const newFileName = `${req.file.filename}.${ext}`;

    fs.renameSync(`${destFile}${req.file.filename}`, `${destFile}${newFileName}`);

    return res.json({
        message: 'File uploaded successfully',
        file: {
            name: newFileName,
            path: `${destFile}${newFileName}`,
            size: req.file.size
        }
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction): any => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ message: 'File size is too large. Maximum size is 10MB.' });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ message: 'Too many files uploaded.' });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ message: 'Unexpected file field.' });
            default:
                return res.status(400).json({ message: err.message });
        }
    } else if (err) {
        return res.status(500).json({ message: err.message });
    }
    next();
});

app.listen(port, () => console.log(`Server running on port ${port}`));