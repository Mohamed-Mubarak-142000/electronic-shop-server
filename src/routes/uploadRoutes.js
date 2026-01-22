import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../config/cloudinary.js';

const router = express.Router();



const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
    res.json({ path: req.file.path });
});

router.post('/cloudinary', upload.single('image'), (req, res) => {
    res.json({ path: req.file.path });
});

router.post('/multiple', upload.array('images', 10), (req, res) => {
    const filePaths = req.files.map(file => file.path);
    res.send(filePaths);
});

router.post('/cloudinary/multiple', upload.array('images', 10), (req, res) => {
    const filePaths = req.files.map(file => file.path);
    res.send(filePaths);
});

export default router;
