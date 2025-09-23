#!/usr/bin/env node

/**
 * Setup script to copy required libraries to project root
 * This ensures html-docx-js is available locally
 */

const fs = require("fs")
const path = require("path")

console.log("🔧 Setting up local libraries...")

// Copy html-docx-js
const sourceFile = path.join(__dirname, "node_modules", "html-docx-js", "dist", "html-docx.js")
const targetFile = path.join(__dirname, "html-docx.js")

if (fs.existsSync(sourceFile)) {
  try {
    fs.copyFileSync(sourceFile, targetFile)
    console.log("✅ html-docx.js copied successfully")
  } catch (error) {
    console.error("❌ Error copying html-docx.js:", error.message)
    process.exit(1)
  }
} else {
  console.error("❌ html-docx-js not found in node_modules")
  console.log("💡 Run: npm install html-docx-js@0.3.1")
  process.exit(1)
}

console.log("🎉 Library setup completed!")
