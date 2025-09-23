if (typeof htmlDocx === "undefined") {
  console.error("html-docx-js failed to load from local file")
  window.htmlDocx = {
    asBlob: function () {
      throw new Error("html-docx-js library not loaded. Please check if html-docx.js file exists.")
    }
  }
} else {
  console.log("html-docx-js loaded successfully from local file")
}

// Alternative DOCX generation function using simple text conversion
window.generateSimpleDOCX = function (htmlContent, filename) {
  try {
    // Create a simple text version
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent
    const textContent = tempDiv.textContent || tempDiv.innerText || ""

    // Create a simple RTF-like content
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24 ${textContent.replace(/\n/g, "\\par ").replace(/\s+/g, " ")}}`

    // Create blob and download
    const blob = new Blob([rtfContent], {type: "application/rtf"})
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename.replace(".docx", ".rtf")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Error generating simple DOCX:", error)
    return false
  }
}
