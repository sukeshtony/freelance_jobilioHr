const express = require("express");
const router = express.Router();
const mammoth = require("mammoth");
const textract = require("textract");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
dotenv.config();

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "temp/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Extract PDF text
async function extractPdfText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text.trim();
}

// DOCX
async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim();
}

// DOC
function extractDocText(filePath) {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (err, text) => {
      if (err) reject(err);
      else resolve(text.trim());
    });
  });
}

// Unified extractor
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") return await extractPdfText(filePath);
  if (ext === ".docx") return await extractDocxText(filePath);
  if (ext === ".doc") return await extractDocText(filePath);

  throw new Error("Unsupported file format");
}

router.post("/parser", upload.single("resume"), async (req, res) => {
  let filePath = null;

  try {
    filePath = req.file?.path;
    if (!filePath) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const extractedText = await extractText(filePath);
    

    const instructions = `
Extract structured data from this resume to auto-fill a form.

RULES:
1. Phone: No country code. Only 10 digits.
2. dob Date format: YYYY-MM-DD
3. objective: Use Professional Summary / Career Objective.
4. linkedin: Extract LinkedIn URL.
5. experience: Only a number. Example: 3
6. jobType: Must be one of: Full-time, Part-time, Internship, Contract, Freelance
7. workMode: Must be one of: On-site, Remote, Hybrid
8. expectedSalary: Only numbers like "50000" (no ₹, no symbols)
9. noticePeriod: Only these: Immediately, 1 week, 2 weeks, 1 month, 2 months, 3 months
10. companies[].startDate & endDate → YYYY-MM
11. education[].startDate & endDate → YYYY-MM
12. gender: Male, Female, Other, Prefer not to say
13. Return JSON EXACTLY in this structure:
{
  "name": "",
  "title": "",
  "email": "",
  "phone": "",
  "dob": "",
  "gender": "",
  "address": "",
  "city": "",
  "state": "",
  "country": "",
  "zip": "",
  "linkedin": "",
  "languages": [],
  "objective": "",
  "experience": 0,
  "jobType": "",
  "workMode": "",
  "expectedSalary": "",
  "noticePeriod": "",
  "companies": [
    {
      "name": "",
      "position": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "responsibilities": "",
      "achievements": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institute": "",
      "customInstitute": "",
      "startDate": "",
      "endDate": "",
      "currentlyStudying": false
    }
  ],
  "skills": [],
  "certifications": []
}
`;

    let result;

    // -----------------------------------------
    //  CASE 1: Extracted text exists → send TEXT
    // -----------------------------------------
    if (extractedText && extractedText.length > 50) {
      console.log("✔ Sending extracted text to Gemini…");

      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: instructions + "\n\nResume:\n" + extractedText }] }]
      });
    } 
    else {
      // -----------------------------------------
      //  CASE 2: No text → send PDF FILE to Gemini
      // -----------------------------------------
      console.log("⚠ No text found. Sending PDF file to Gemini…");
      const fileBuffer = fs.readFileSync(filePath);
      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: instructions },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: fileBuffer.toString("base64")
                }
              }
            ]
          }
        ]
      });
    }

    let aiText = result.response.text().replace(/```json|```/g, "").trim();

    let parsed = {};
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI response:", aiText);
      return res.status(500).json({ success: false, error: "Failed to parse AI JSON output" });
    }

    res.json({ success: true, data: parsed });

  } catch (err) {
    console.error("Resume parse error:", err);
    res.status(500).json({ success: false, error: err.message });

  } finally {
    try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Temporary upload deleted:", filePath);
    }
  } catch (cleanupErr) {
    console.error("Failed to delete temp file:", cleanupErr);
  }
  }
});

module.exports = router;
