const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
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
          lastUpdated: data.lastUpdated
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📁 Data directory: ${dataDir}`)
  console.log(`📄 Available endpoints:`)
  console.log(`   POST /api/save-lebenslauf`)
  console.log(`   POST /api/save-anschreiben`)
  console.log(`   GET  /api/file-info/:type/:lang`)
})
