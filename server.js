const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")
const translate = require("translate-google")

const app = express()
const PORT = 8000

// Middleware with detailed CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:8000",
      "http://localhost:3000",
      "http://127.0.0.1:8000",
      "http://127.0.0.1:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
)

// Additional CORS headers for all responses
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || "unknown"}`)
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
  res.header("Access-Control-Allow-Credentials", "true")
  if (req.method === "OPTIONS") {
    console.log(`✅ OPTIONS preflight for ${req.url}`)
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())
app.use(express.static("."))

// Ensure data directory exists
const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, {recursive: true})
  console.log("📁 Created data directory")
}

// Function to ensure file exists and create if not
function ensureFileExists(filePath, defaultData = {}) {
  if (!fs.existsSync(filePath)) {
    const defaultContent = {
      ...defaultData,
      lastUpdated: new Date().toISOString()
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2))
    console.log(`📄 Created file: ${filePath}`)
    return true // File was created
  }
  return false // File already existed
}

// API endpoint to save Lebenslauf data
app.post("/api/save-lebenslauf", (req, res) => {
  try {
    console.log("=== SAVE LEBENSLAUF REQUEST ===")
    console.log("Request body:", JSON.stringify(req.body, null, 2))
    console.log("Photo data:", req.body.photo ? "Present" : "Missing")
    if (req.body.photo) {
      console.log("Photo type:", typeof req.body.photo)
      console.log("Photo length:", req.body.photo.length)
      console.log("Photo starts with data:image/:", req.body.photo.startsWith("data:image/"))
    }

    const {lang = "uk", ...data} = req.body

    // Determine file path based on language
    const fileName =
      lang === "de"
        ? "lebenslauf_data_de.json"
        : lang === "en"
          ? "lebenslauf_data_en.json"
          : "lebenslauf_data.json"

    const filePath = path.join(dataDir, fileName)

    // Prepare data with metadata
    const dataToSave = {
      ...data,
      lang,
      lastUpdated: new Date().toISOString()
    }

    // Check if file was created (new) or updated (existing)
    const wasCreated = ensureFileExists(filePath, dataToSave)

    // Write data to file
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2))

    const message = wasCreated
      ? `✅ File ${fileName} created successfully!`
      : `✅ File ${fileName} updated successfully!`

    console.log(message)

    res.json({
      success: true,
      message,
      fileName,
      wasCreated,
      timestamp: dataToSave.lastUpdated
    })
  } catch (error) {
    console.error("Error saving Lebenslauf data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to save Lebenslauf data",
      details: error.message
    })
  }
})

// API endpoint to save Anschreiben data
app.post("/api/save-anschreiben", (req, res) => {
  try {
    const {lang = "uk", ...data} = req.body

    // Determine file path based on language
    const fileName =
      lang === "de"
        ? "anschreiben_data_de.json"
        : lang === "en"
          ? "anschreiben_data_en.json"
          : "anschreiben_data.json"

    const filePath = path.join(dataDir, fileName)

    // Prepare data with metadata
    const dataToSave = {
      ...data,
      lang,
      lastUpdated: new Date().toISOString()
    }

    // Check if file was created (new) or updated (existing)
    const wasCreated = ensureFileExists(filePath, dataToSave)

    // Write data to file
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2))

    const message = wasCreated
      ? `✅ File ${fileName} created successfully!`
      : `✅ File ${fileName} updated successfully!`

    console.log(message)

    res.json({
      success: true,
      message,
      fileName,
      wasCreated,
      timestamp: dataToSave.lastUpdated
    })
  } catch (error) {
    console.error("Error saving Anschreiben data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to save Anschreiben data",
      details: error.message
    })
  }
})

// API endpoint to get file info
app.get("/api/file-info/:type/:lang", (req, res) => {
  try {
    const {type, lang} = req.params

    let fileName
    if (type === "lebenslauf") {
      fileName =
        lang === "de"
          ? "lebenslauf_data_de.json"
          : lang === "en"
            ? "lebenslauf_data_en.json"
            : "lebenslauf_data.json"
    } else if (type === "anschreiben") {
      fileName =
        lang === "de"
          ? "anschreiben_data_de.json"
          : lang === "en"
            ? "anschreiben_data_en.json"
            : "anschreiben_data.json"
    } else {
      return res.status(400).json({error: "Invalid type"})
    }

    const filePath = path.join(dataDir, fileName)

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"))

      res.json({
        exists: true,
        fileName,
        size: stats.size,
        lastModified: stats.mtime,
        data: {
          fullName: data.fullName || "N/A",
          email: data.email || "N/A",
          lastUpdated: data.lastUpdated,
          photo: data.photo || null
        }
      })
    } else {
      res.json({
        exists: false,
        fileName,
        message: "File does not exist"
      })
    }
  } catch (error) {
    console.error("Error getting file info:", error)
    res.status(500).json({
      success: false,
      error: "Failed to get file info",
      details: error.message
    })
  }
})

// Translation endpoint
app.post("/api/translate", async (req, res) => {
  try {
    const {text, targetLang, sourceLang = "auto"} = req.body

    if (!text || !targetLang) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["text", "targetLang"]
      })
    }

    console.log(`🌐 Translating "${text}" from ${sourceLang} to ${targetLang}`)

    const translatedText = await translate(text, {
      from: sourceLang,
      to: targetLang
    })

    console.log(`✅ Translation successful: "${translatedText}"`)

    res.json({
      originalText: text,
      translatedText: translatedText,
      sourceLang: sourceLang,
      targetLang: targetLang
    })
  } catch (error) {
    console.log(`❌ Translation error: ${error.message}`)
    res.status(500).json({
      error: "Translation failed",
      message: error.message,
      originalText: req.body.text || ""
    })
  }
})

// Start server
// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`)
  res.status(404).json({error: "Not Found", path: req.url})
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📁 Data directory: ${dataDir}`)
  console.log(`📄 Available endpoints:`)
  console.log(`   POST /api/save-lebenslauf`)
  console.log(`   POST /api/save-anschreiben`)
  console.log(`   GET  /api/file-info/:type/:lang`)
  console.log(`   POST /api/translate`)
  console.log(`🌐 Open your browser to: http://localhost:${PORT}`)
})
