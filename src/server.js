require('dotenv').config(); // Load environment variables from .env file

const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 5500;

// Log environment variables to ensure they are loaded correctly
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

// Set up MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL!");
});

// Configure AWS SDK using environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Test S3 connection
s3.listBuckets((err, data) => {
  if (err) {
    console.error("Error connecting to S3:", err);
  } else {
    console.log("Connected to S3 successfully. Available buckets:");
    console.log(data.Buckets);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to handle image upload to S3
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Use environment variable
    Key: `${Date.now()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading to S3:", err);
      return res.status(500).send(err);
    }
    res.send({ url: data.Location });
  });
});

// Route to insert employee data into RDS
app.post("/api/emp", (req, res) => {
  const { empId, name, primarySkill, loc, imageUrl } = req.body;

  if (!empId || !name || !primarySkill || !loc || !imageUrl) {
    return res.status(400).send("All fields are required.");
  }

  const query =
    "INSERT INTO emp (empId, name, primarySkill, loc, imageUrl) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [empId, name, primarySkill, loc, imageUrl], (err, result) => {
    if (err) {
      console.error("Error inserting data into MySQL:", err);
      return res.status(500).send(err);
    }
    res.send("Employee data inserted successfully");
  });
});

// Start the server
app.listen(port, '0.0.0.0' () => {
  console.log(`Server running on http://localhost:${port}`);
});
