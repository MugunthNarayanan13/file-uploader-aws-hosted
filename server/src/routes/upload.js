const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../services/s3");
const dynamodb = require("../services/dynamodb");
const generateFileMeta = require("../utils/generateFileMeta");

const router = express.Router();

// Multer config (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /upload
router.post("/", upload.any(), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Grab paths: can be string or array if multiple files
    const paths = req.body.path;

    const responses = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Handle if paths is array or string or undefined
      const currentPath = Array.isArray(paths) ? paths[i] : paths || "";
      const file_id = uuidv4();
      const s3_key = `${currentPath}${file.originalname}`;

      // Upload file to S3
      await s3.uploadToS3(s3_key, file);

      // Save metadata to DynamoDB
      const metadata = generateFileMeta(file_id, file, s3_key, currentPath);
      await dynamodb.saveFileMeta(metadata);

      responses.push({ file_id, file_name: file.originalname });
    }

    res.status(200).json({ message: "Uploaded", files: responses });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});  

module.exports = router;
