let formData = {}
let globalPhotoData = null
let currentPreviewType = "lebenslauf"
let livePrintPreview = null

// stateManager доступний глобально з state-management.js
let formHandler = null
// validationService доступний глобально з validation-service.js
// exportService доступний глобально з export-service.js
// performanceMonitor доступний глобально з performance-monitor.js
let accessibilityManager = null
let domCache = null
let eventManager = null

function saveFormData() {
  try {
    if (stateManager) {
      const dataToSave = {
        formData: formData,
        globalPhotoData: globalPhotoData,
        currentPreviewType: currentPreviewType
      };
      stateManager.saveState(dataToSave);
      logger.log("Form data saved via StateManager");
    } else {
      const dataToSave = {
        formData: formData,
        globalPhotoData: globalPhotoData,
        currentPreviewType: currentPreviewType
      };
      localStorage.setItem("resumeFormData", JSON.stringify(dataToSave));
      logger.log("Form data saved to localStorage (fallback)");
    }
  } catch (error) {
    logger.error("Error saving form data:", error);
  }
}

function loadFormData() {
  try {
    if (stateManager) {
      const loaded = stateManager.loadState();
      if (loaded) {
        const state = stateManager.getState();
        formData = state.formData || {};
        globalPhotoData = state.globalPhotoData || null;
        currentPreviewType = state.currentPreviewType || "bewerbung";
        restoreFormValues();
        logger.log("Form data loaded via StateManager");
        return true;
      }
    } else {
      const savedData = localStorage.getItem("resumeFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        formData = parsedData.formData || {};
        globalPhotoData = parsedData.globalPhotoData || null;
        currentPreviewType = parsedData.currentPreviewType || "bewerbung";
        restoreFormValues();
        logger.log("Form data loaded from localStorage (fallback)");
        return true;
      }
    }
  } catch (error) {
    logger.error("Error loading form data:", error);
  }
  return false;
}

// Load data from localStorage if available
function loadFromLocalStorage(type, lang) {
  const storageKey = `${type}_data_${lang}`
  const data = localStorage.getItem(storageKey)
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      logger.error("Error parsing localStorage data:", e)
    }
  }
  return null
}

// Функція для видалення небажаного тексту "Station Service Angestellter" з localStorage
function removeUnwantedPositionText() {
  try {
    const savedData = localStorage.getItem("resumeFormData")
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      if (parsedData.formData && parsedData.formData.position === "Station Service Angestellter") {
        parsedData.formData.position = ""
        localStorage.setItem("resumeFormData", JSON.stringify(parsedData))
        logger.log("Видалено небажаний текст 'Station Service Angestellter' з localStorage")

        // Також очистити поле в формі, якщо воно заповнене цим текстом
        const positionField = document.getElementById("position")
        if (positionField && positionField.value === "Station Service Angestellter") {
          positionField.value = ""
        }
      }
    }
  } catch (error) {
    logger.error("Помилка при видаленні небажаного тексту:", error)
  }
}

// Load data from JSON files based on current language and tab
async function loadDataFromJSON() {
  try {
    const currentLang = currentLanguage || "uk"

    // Check current active tab
    const lebenslaufTab = document.querySelector(".form-tab-button[onclick*='lebenslauf']")
    const bewerbungTab = document.querySelector(".form-tab-button[onclick*='bewerbung']")
    const isLebenslaufActive = lebenslaufTab && lebenslaufTab.classList.contains("active")
    const isBewerbungActive = bewerbungTab && bewerbungTab.classList.contains("active")

    let dataFile, successMessage, errorMessage

    if (isLebenslaufActive) {
      // Load Lebenslauf data
      dataFile =
        currentLang === "de"
          ? "./data/lebenslauf_data_de.json"
          : currentLang === "en"
            ? "./data/lebenslauf_data_en.json"
            : "./data/lebenslauf_data.json" // Ukrainian default

      successMessage =
        currentLang === "uk"
          ? "✅ Дані резюме успішно завантажено!"
          : currentLang === "de"
            ? "✅ Lebenslauf-Daten erfolgreich geladen!"
            : "✅ Resume data loaded successfully!"

      errorMessage =
        currentLang === "uk"
          ? "❌ Помилка завантаження даних резюме"
          : currentLang === "de"
            ? "❌ Fehler beim Laden der Lebenslauf-Daten"
            : "❌ Error loading resume data"

      showStatus(
        currentLang === "uk"
          ? "Завантаження даних резюме..."
          : currentLang === "de"
            ? "Lebenslauf-Daten werden geladen..."
            : "Loading resume data...",
        "info"
      )

      try {
        const response = await fetch(dataFile)
        if (response.ok) {
          const data = await response.json()
          await populateFormWithLebenslaufData(data)
          showStatus(successMessage, "success")
          return
        } else {
          throw new Error(`Failed to load data: ${response.status}`)
        }
      } catch (fetchError) {
        logger.warn("Server not available, trying localStorage:", fetchError.message)

        // Try to load from localStorage
        const localData = loadFromLocalStorage("lebenslauf", currentLang)
        if (localData) {
          await populateFormWithLebenslaufData(localData)
          const localSuccessMessage =
            currentLang === "uk"
              ? "✅ Дані Lebenslauf завантажено з локального сховища"
              : currentLang === "de"
                ? "✅ Lebenslauf-Daten aus lokalem Speicher geladen"
                : "✅ Lebenslauf data loaded from local storage"
          showStatus(localSuccessMessage, "warning")
          return
        } else {
          throw new Error("No data available locally or from server")
        }
      }
    } else if (isBewerbungActive) {
      // Load Anschreiben data
      dataFile =
        currentLang === "de"
          ? "./data/anschreiben_data_de.json"
          : currentLang === "en"
            ? "./data/anschreiben_data_en.json"
            : "./data/anschreiben_data.json" // Ukrainian default

      successMessage =
        currentLang === "uk"
          ? "✅ Дані листа заявки успішно завантажено!"
          : currentLang === "de"
            ? "✅ Anschreiben-Daten erfolgreich geladen!"
            : "✅ Cover letter data loaded successfully!"

      errorMessage =
        currentLang === "uk"
          ? "❌ Помилка завантаження даних листа заявки"
          : currentLang === "de"
            ? "❌ Fehler beim Laden der Anschreiben-Daten"
            : "❌ Error loading cover letter data"

      showStatus(
        currentLang === "uk"
          ? "Завантаження даних листа заявки..."
          : currentLang === "de"
            ? "Anschreiben-Daten werden geladen..."
            : "Loading cover letter data...",
        "info"
      )

      try {
        const response = await fetch(dataFile)
        if (response.ok) {
          const data = await response.json()
          await populateFormWithAnschreibenData(data)
          showStatus(successMessage, "success")
          return
        } else {
          throw new Error(`Failed to load data: ${response.status}`)
        }
      } catch (fetchError) {
        logger.warn("Server not available, trying localStorage:", fetchError.message)

        // Try to load from localStorage
        const localData = loadFromLocalStorage("anschreiben", currentLang)
        if (localData) {
          await populateFormWithAnschreibenData(localData)
          const localSuccessMessage =
            currentLang === "uk"
              ? "✅ Дані Anschreiben завантажено з локального сховища"
              : currentLang === "de"
                ? "✅ Anschreiben-Daten aus lokalem Speicher geladen"
                : "✅ Anschreiben data loaded from local storage"
          showStatus(localSuccessMessage, "warning")
          return
        } else {
          throw new Error("No data available locally or from server")
        }
      }
    } else {
      // No active tab
      const noTabMessage =
        currentLang === "uk"
          ? "❌ Перейдіть на вкладку 'Anschreiben' або 'Lebenslauf' для завантаження даних"
          : currentLang === "de"
            ? "❌ Wechseln Sie zum 'Anschreiben' oder 'Lebenslauf' Tab, um Daten zu laden"
            : "❌ Switch to 'Anschreiben' or 'Lebenslauf' tab to load data"

      showStatus(noTabMessage, "error")
      return
    }
  } catch (error) {
    logger.error("Error loading data from JSON:", error)
    const currentLang = currentLanguage || "uk"
    const errorMessage =
      currentLang === "uk"
        ? "❌ Помилка завантаження даних з JSON файлу"
        : currentLang === "de"
          ? "❌ Fehler beim Laden der Daten aus der JSON-Datei"
          : "❌ Error loading data from JSON file"

    showStatus(errorMessage, "error")
  }
}

// Restore form values from formData
function restoreFormValues() {
  // Restore main form values
  const form = DOM.bewerbungForm
  if (form) {
    Object.keys(formData).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`)
      if (input && input.type !== "file") {
        input.value = formData[key] || ""
      }
    })
  }

  // Restore Lebenslauf form values
  const lebenslaufSection = DOM.lebenslaufSection
  if (lebenslaufSection) {
    Object.keys(formData).forEach(key => {
      const input = lebenslaufSection.querySelector(`[name="${key}"]`)
      if (input && input.type !== "file") {
        input.value = formData[key] || ""
      }
    })
  }

  // Restore photo if exists
  if (globalPhotoData && typeof globalPhotoData === "string") {
    logger.log("Restoring photo from globalPhotoData:", globalPhotoData.substring(0, 50) + "...")
    const photoPreview = DOM.photoPreview
    if (photoPreview) {
      photoPreview.innerHTML = `<img src="${globalPhotoData}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`
      const removePhotoBtn = DOM.removePhoto
      if (removePhotoBtn) {
        removePhotoBtn.style.display = "block"
      }
      logger.log("✅ Photo restored in left menu")
    }
  } else {
    logger.log("No globalPhotoData to restore or not a string:", typeof globalPhotoData)

    // Try to load photo from formData
    if (
      formData.lebenslaufPhoto &&
      typeof formData.lebenslaufPhoto === "string" &&
      formData.lebenslaufPhoto.startsWith("data:image/")
    ) {
      logger.log("Found photo in formData.lebenslaufPhoto, restoring...")
      globalPhotoData = formData.lebenslaufPhoto
      const photoPreview = DOM.photoPreview
      if (photoPreview) {
        photoPreview.innerHTML = `<img src="${formData.lebenslaufPhoto}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`
        const removePhotoBtn = DOM.removePhoto
        if (removePhotoBtn) {
          removePhotoBtn.style.display = "block"
        }
        logger.log("✅ Photo restored from formData")
      }
    }
  }
}

// Save Lebenslauf data to JSON file
async function saveLebenslaufData() {
  // Check current active tab
  const lebenslaufTab = document.querySelector(".form-tab-button[onclick*='lebenslauf']")
  const bewerbungTab = document.querySelector(".form-tab-button[onclick*='bewerbung']")
  const isLebenslaufActive = lebenslaufTab && lebenslaufTab.classList.contains("active")
  const isBewerbungActive = bewerbungTab && bewerbungTab.classList.contains("active")

  // If user is on Bewerbung tab, redirect to save Anschreiben data instead
  if (isBewerbungActive) {
    const currentLang = currentLanguage || "uk"
    const redirectMessage =
      currentLang === "uk"
        ? "ℹ️ Ви на вкладці 'Bewerbung'. Зберігаю дані листа заявки..."
        : currentLang === "de"
          ? "ℹ️ Sie sind auf dem 'Bewerbung' Tab. Speichere Anschreiben-Daten..."
          : "ℹ️ You are on 'Bewerbung' tab. Saving cover letter data..."

    showStatus(redirectMessage, "info")
    await saveAnschreibenData()
    return
  }

  // If user is on neither tab, show error
  if (!isLebenslaufActive) {
    const currentLang = currentLanguage || "uk"
    const errorMessage =
      currentLang === "uk"
        ? "❌ Перейдіть на вкладку 'Lebenslauf' або 'Bewerbung' для збереження даних"
        : currentLang === "de"
          ? "❌ Wechseln Sie zum 'Lebenslauf' oder 'Bewerbung' Tab, um Daten zu speichern"
          : "❌ Switch to 'Lebenslauf' or 'Bewerbung' tab to save data"

    showStatus(errorMessage, "error")
    return
  }

  // Get current language
  const currentLang = currentLanguage || "uk"
  logger.log("Saving Lebenslauf data for language:", currentLang)

  // Get photo data from input if not already available
  let photoData = globalPhotoData || formData.lebenslaufPhoto || null

  // Check if photo data is valid (not fake path)
  const isValidPhotoData = photoData && photoData.startsWith("data:image/")

  // If no valid photo data but input has file, try to read it
  if (!isValidPhotoData) {
    logger.log("📸 No valid photo data found, checking input...")
    const photoInput = DOM.lebenslaufPhoto
    if (photoInput && photoInput.files && photoInput.files.length > 0) {
      logger.log("📸 Photo file found in input, reading...")
      const file = photoInput.files[0]

      // Read file asynchronously using FileReader
      photoData = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function (e) {
          logger.log("📸 Photo read successfully:", e.target.result.length, "characters")
          resolve(e.target.result)
        }
        reader.onerror = function (e) {
          logger.error("📸 Error reading photo:", e)
          reject(e)
        }
        reader.readAsDataURL(file)
      })
    } else {
      logger.log("📸 No photo file found in input")
    }
  } else {
    logger.log("📸 Valid photo data already exists")
  }

  // Update globalPhotoData and formData with the correct photo data
  if (photoData && photoData.startsWith("data:image/")) {
    globalPhotoData = photoData
    formData.lebenslaufPhoto = photoData
    logger.log("📸 Updated globalPhotoData and formData with correct photo")
  }

  const lebenslaufData = {
    fullName: document.getElementById("lebenslaufFullName")?.value || "",
    birthDate: document.getElementById("lebenslaufBirthDate")?.value || "",
    address: document.getElementById("lebenslaufAddress")?.value || "",
    phone: document.getElementById("lebenslaufPhone")?.value || "",
    email: document.getElementById("lebenslaufEmail")?.value || "",
    nationality: document.getElementById("lebenslaufNationality")?.value || "",
    residenceStatus: document.getElementById("lebenslaufResidenceStatus")?.value || "",
    summary: document.getElementById("lebenslaufSummary")?.value || "",
    skills: document.getElementById("lebenslaufSkills")?.value || "",
    experience: document.getElementById("lebenslaufExperience")?.value || "",
    education: document.getElementById("lebenslaufEducation")?.value || "",
    certifications: document.getElementById("lebenslaufCertifications")?.value || "",
    languages: document.getElementById("lebenslaufLanguages")?.value || "",
    additional: document.getElementById("lebenslaufAdditional")?.value || "",
    photo: photoData,
    lastUpdated: new Date().toISOString(),
    lang: currentLang
  }

  logger.log("Saving data for language:", currentLang, "Data:", lebenslaufData)
  logger.log("Photo data check:")
  logger.log("  globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("  formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")
  logger.log("  isValidPhotoData:", isValidPhotoData)
  logger.log("  photoData (final):", photoData ? "Present" : "Missing")
  logger.log("  Final photo value:", lebenslaufData.photo ? "Present" : "Missing")

  // Детальна діагностика фото
  if (globalPhotoData) {
    logger.log("  globalPhotoData type:", typeof globalPhotoData)
    logger.log("  globalPhotoData length:", globalPhotoData.length)
    logger.log(
      "  globalPhotoData starts with data:image/:",
      globalPhotoData.startsWith("data:image/")
    )
  }
  if (formData.lebenslaufPhoto) {
    logger.log("  formData.lebenslaufPhoto type:", typeof formData.lebenslaufPhoto)
    logger.log("  formData.lebenslaufPhoto length:", formData.lebenslaufPhoto.length)
    logger.log(
      "  formData.lebenslaufPhoto starts with data:image/:",
      formData.lebenslaufPhoto.startsWith("data:image/")
    )
  }
  if (photoData) {
    logger.log("  photoData type:", typeof photoData)
    logger.log("  photoData length:", photoData.length)
    logger.log("  photoData starts with data:image/:", photoData.startsWith("data:image/"))
  }

  try {
    logger.log(`Saving Lebenslauf data for language: ${currentLang}`)

    // Save data locally (no server needed for dynamic preview)
    try {
      // Save to localStorage for persistence
      localStorage.setItem("lebenslaufData", JSON.stringify(lebenslaufData))
      logger.log("Lebenslauf data saved locally:", lebenslaufData)

      // Show success message in current language
      const successMessage =
        getTranslation("messages.dataSavedLocally") ||
        (currentLang === "uk"
          ? "✅ Lebenslauf дані збережено локально!"
          : currentLang === "de"
            ? "✅ Lebenslauf Daten lokal gespeichert!"
            : "✅ Lebenslauf data saved locally!")

      showStatus(successMessage, "success")
    } catch (error) {
      logger.error("Failed to save Lebenslauf data locally:", error)
      const errorMessage =
        currentLang === "uk"
          ? "❌ Помилка збереження даних Lebenslauf"
          : currentLang === "de"
            ? "❌ Fehler beim Speichern der Lebenslauf-Daten"
            : "❌ Error saving Lebenslauf data"
      showStatus(errorMessage, "error")
    }
  } catch (error) {
    logger.error("Error saving Lebenslauf data:", error)
    const errorMessage =
      getTranslation("messages.saveError") ||
      (currentLang === "uk"
        ? "Помилка збереження даних Lebenslauf"
        : currentLang === "de"
          ? "Fehler beim Speichern der Lebenslauf-Daten"
          : "Error saving Lebenslauf data")

    showStatus(errorMessage, "error")
  }
}

// Save Anschreiben data to JSON file
async function saveAnschreibenData() {
  // Check current active tab
  const lebenslaufTab = document.querySelector(".form-tab-button[onclick*='lebenslauf']")
  const bewerbungTab = document.querySelector(".form-tab-button[onclick*='bewerbung']")
  const isLebenslaufActive = lebenslaufTab && lebenslaufTab.classList.contains("active")
  const isBewerbungActive = bewerbungTab && bewerbungTab.classList.contains("active")

  // If user is on Lebenslauf tab, redirect to save Lebenslauf data instead
  if (isLebenslaufActive) {
    const currentLang = currentLanguage || "uk"
    const redirectMessage =
      currentLang === "uk"
        ? "ℹ️ Ви на вкладці 'Lebenslauf'. Зберігаю дані резюме..."
        : currentLang === "de"
          ? "ℹ️ Sie sind auf dem 'Lebenslauf' Tab. Speichere Lebenslauf-Daten..."
          : "ℹ️ You are on 'Lebenslauf' tab. Saving resume data..."

    showStatus(redirectMessage, "info")
    await saveLebenslaufData()
    return
  }

  // If user is on neither tab, show error
  if (!isBewerbungActive) {
    const currentLang = currentLanguage || "uk"
    const errorMessage =
      currentLang === "uk"
        ? "❌ Перейдіть на вкладку 'Lebenslauf' або 'Bewerbung' для збереження даних"
        : currentLang === "de"
          ? "❌ Wechseln Sie zum 'Lebenslauf' oder 'Bewerbung' Tab, um Daten zu speichern"
          : "❌ Switch to 'Lebenslauf' or 'Bewerbung' tab to save data"

    showStatus(errorMessage, "error")
    return
  }

  // Get current language
  const currentLang = currentLanguage || "uk"
  logger.log("Saving Anschreiben data for language:", currentLang)

  // Collect Anschreiben data from form fields
  const anschreibenData = {
    // Personal data
    fullName: document.getElementById("fullName")?.value || "",
    address: document.getElementById("address")?.value || "",
    phone: document.getElementById("phone")?.value || "",
    email: document.getElementById("email")?.value || "",
    birthDate: document.getElementById("birthDate")?.value || "",
    nationality: document.getElementById("nationality")?.value || "",

    // Job application specific
    position: document.getElementById("position")?.value || "",
    company: document.getElementById("company")?.value || "",
    jobNumber: document.getElementById("jobNumber")?.value || "",
    contactName: document.getElementById("contactName")?.value || "",
    contactAddress: document.getElementById("contactAddress")?.value || "",
    contactPhone: document.getElementById("contactPhone")?.value || "",
    contactEmail: document.getElementById("contactEmail")?.value || "",
    subject: document.getElementById("subject")?.value || "",
    motivation: document.getElementById("motivation")?.value || "",
    qualifications: document.getElementById("qualifications")?.value || "",

    // Additional fields that might be relevant for Anschreiben
    experience: document.getElementById("experience")?.value || "",
    education: document.getElementById("education")?.value || "",
    languages: document.getElementById("languages")?.value || "",
    additional: document.getElementById("additional")?.value || "",

    // Metadata
    lastUpdated: new Date().toISOString(),
    lang: currentLang
  }

  logger.log("Saving Anschreiben data for language:", currentLang, "Data:", anschreibenData)

  try {
    // Try to save to server first
    try {
      const response = await fetch("/api/save-anschreiben", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(anschreibenData)
      })

      if (response.ok) {
        const result = await response.json()
        logger.log("Anschreiben data saved to server:", result)

        const successMessage =
          getTranslation("messages.dataSaved") ||
          (currentLang === "uk"
            ? "✅ Anschreiben дані збережено на сервері!"
            : currentLang === "de"
              ? "✅ Anschreiben Daten auf dem Server gespeichert!"
              : "✅ Anschreiben data saved to server!")

        showStatus(successMessage, "success")
        return
      } else {
        logger.warn("Server save failed, falling back to local storage")
        throw new Error("Server save failed")
      }
    } catch (serverError) {
      logger.log("Server not available, saving locally:", serverError.message)

      // Fallback to localStorage
      localStorage.setItem("anschreibenData", JSON.stringify(anschreibenData))
      logger.log("Anschreiben data saved locally:", anschreibenData)

      const successMessage =
        getTranslation("messages.dataSavedLocally") ||
        (currentLang === "uk"
          ? "✅ Anschreiben дані збережено локально!"
          : currentLang === "de"
            ? "✅ Anschreiben Daten lokal gespeichert!"
            : "✅ Anschreiben data saved locally!")

      showStatus(successMessage, "success")
    }
  } catch (error) {
    logger.error("Error saving Anschreiben data:", error)
    const errorMessage =
      getTranslation("messages.saveError") ||
      (currentLang === "uk"
        ? "Помилка збереження даних Anschreiben"
        : currentLang === "de"
          ? "Fehler beim Speichern der Anschreiben-Daten"
          : "Error saving Anschreiben data")

    showStatus(errorMessage, "error")
  }
}
// Show current JSON data info
async function showCurrentDataInfo() {
  const currentLang = currentLanguage || "uk"

  try {
    // Show current form data instead of file info
    logger.log("Showing current form data info")

    const currentValues = getCurrentFormValues()
    const activeTab = getCurrentActiveTab()

    let infoMessage = ""

    // Show current active tab
    infoMessage +=
      currentLang === "uk"
        ? `📋 Активна вкладка: ${activeTab === "bewerbung" ? "Anschreiben" : "Lebenslauf"}\n\n`
        : currentLang === "de"
          ? `📋 Aktive Registerkarte: ${activeTab === "bewerbung" ? "Anschreiben" : "Lebenslauf"}\n\n`
          : `📋 Active tab: ${activeTab === "bewerbung" ? "Anschreiben" : "Lebenslauf"}\n\n`

    // Show form data summary
    if (currentValues.fullName || currentValues.lebenslaufFullName) {
      const name = currentValues.fullName || currentValues.lebenslaufFullName
      const email = currentValues.email || currentValues.lebenslaufEmail

      infoMessage +=
        currentLang === "uk"
          ? `👤 Ім'я: ${name}\n📧 Email: ${email || "Не вказано"}\n📅 Останнє оновлення: ${new Date().toLocaleString()}\n\n`
          : currentLang === "de"
            ? `👤 Name: ${name}\n📧 Email: ${email || "Nicht angegeben"}\n📅 Letzte Aktualisierung: ${new Date().toLocaleString()}\n\n`
            : `👤 Name: ${name}\n📧 Email: ${email || "Not specified"}\n📅 Last updated: ${new Date().toLocaleString()}\n\n`
    } else {
      infoMessage +=
        currentLang === "uk"
          ? `ℹ️ Форма порожня - введіть дані для перегляду інформації\n\n`
          : currentLang === "de"
            ? `ℹ️ Formular ist leer - geben Sie Daten ein, um Informationen zu sehen\n\n`
            : `ℹ️ Form is empty - enter data to view information\n\n`
    }

    // Show data source info
    infoMessage +=
      currentLang === "uk"
        ? `💾 Дані зберігаються локально в браузері\n🔄 Превью оновлюється динамічно`
        : currentLang === "de"
          ? `💾 Daten werden lokal im Browser gespeichert\n🔄 Vorschau wird dynamisch aktualisiert`
          : `💾 Data is stored locally in browser\n🔄 Preview updates dynamically`

    showStatus(infoMessage, "info")
  } catch (error) {
    logger.error("Error loading data info:", error)

    const errorMessage =
      currentLang === "uk"
        ? "❌ Не вдалося завантажити інформацію про дані"
        : currentLang === "de"
          ? "❌ Fehler beim Laden der Dateninformationen"
          : "❌ Failed to load data information"
    showStatus(errorMessage, "error")
  }
}

// Check server status
async function checkServerStatus() {
  const currentLang = currentLanguage || "uk"

  try {
    // Skip API call since we're using dynamic preview
    logger.log("Skipping server status check - using dynamic preview instead")

    const statusMessage =
      currentLang === "uk"
        ? "✅ Динамічне превью активне"
        : currentLang === "de"
          ? "✅ Dynamische Vorschau aktiv"
          : "✅ Dynamic preview active"
    showStatus(statusMessage, "success")
  } catch (error) {
    logger.error("Status check failed:", error)
    showStatus("❌ Помилка перевірки статусу", "error")
  }
}

// Clear all cache and reset form
function clearAllCache() {
  try {
    // Clear localStorage
    localStorage.removeItem("resumeFormData")
    localStorage.removeItem("formData")

    // Reset form data
    formData = {}
    globalPhotoData = null

    // Clear all form fields
    const allInputs = document.querySelectorAll("input, textarea, select")
    allInputs.forEach(input => {
      if (input.type !== "file") {
        input.value = ""
      }
    })

    // Clear photo preview
    const photoPreview = DOM.photoPreview
    if (photoPreview) {
      photoPreview.innerHTML = '<div class="photo-placeholder">📷<br>Kein Foto</div>'
    }

    // Hide remove photo button
    const removePhotoBtn = document.getElementById("removePhotoBtn")
    if (removePhotoBtn) {
      removePhotoBtn.style.display = "none"
    }

    logger.log("All cache cleared and form reset")

    // Show success message in current language
    const currentLang = currentLanguage || "uk"
    const successMessage =
      getTranslation("messages.cacheCleared") ||
      (currentLang === "uk"
        ? "Кеш очищено та форма скинута!"
        : currentLang === "de"
          ? "Cache gelöscht und Formular zurückgesetzt!"
          : "Cache cleared and form reset!")

    showStatus(successMessage, "success")

    // Update preview
    showPreview(currentPreviewType)
  } catch (error) {
    logger.error("Error clearing cache:", error)
    showStatus("Помилка очищення кешу", "error")
  }
}

// Initialize form with default values

// Update theme variables
function updateThemeVariables(theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.style.setProperty("--color-background", "#1a1a1a")
    root.style.setProperty("--color-surface", "#2d2d2d")
    root.style.setProperty("--color-text", "#ffffff")
    root.style.setProperty("--color-text-light", "#cccccc")
    root.style.setProperty("--color-text-muted", "#999999")
    root.style.setProperty("--color-border", "#404040")
    root.style.setProperty("--color-hover", "#3a3a3a")
  } else {
    // Узгоджено з CSS [data-theme="light"]
    root.style.setProperty("--color-background", "#f7f9fc")
    root.style.setProperty("--color-surface", "#ffffff")
    root.style.setProperty("--color-text", "#0f172a")
    root.style.setProperty("--color-text-light", "#334155")
    root.style.setProperty("--color-text-muted", "#64748b")
    root.style.setProperty("--color-border", "#e2e8f0")
    root.style.setProperty("--color-hover", "#eef2f7")
  }
}

// Populate form with Anschreiben data
async function populateFormWithAnschreibenData(data) {
  logger.log("=== populateFormWithAnschreibenData called ===")
  logger.log("Data received:", data)

  try {
    // Switch to Bewerbung tab
    logger.log("Switching to bewerbung tab...")
    await switchFormTab("bewerbung")
    logger.log("Switched to bewerbung tab successfully")
  } catch (switchError) {
    logger.error("Error switching to bewerbung tab:", switchError)
    logger.log("Continuing without tab switch...")
  }

  // Populate main form fields - direct data structure (not nested)
  logger.log("Populating Anschreiben fields...")

  // Personal data
  setFormValue(document, "fullName", data.fullName)
  setFormValue(document, "address", data.address)
  setFormValue(document, "phone", data.phone)
  setFormValue(document, "email", data.email)
  setFormValue(document, "birthDate", data.birthDate)
  setFormValue(document, "nationality", data.nationality)

  // Job application specific
  setFormValue(document, "position", data.position)
  setFormValue(document, "company", data.company)
  setFormValue(document, "jobNumber", data.jobNumber)
  setFormValue(document, "contactName", data.contactName)
  setFormValue(document, "contactAddress", data.contactAddress)
  setFormValue(document, "contactPhone", data.contactPhone)
  setFormValue(document, "contactEmail", data.contactEmail)
  setFormValue(document, "subject", data.subject)
  setFormValue(document, "motivation", data.motivation)
  setFormValue(document, "qualifications", data.qualifications)

  // Additional fields
  setFormValue(document, "experience", data.experience)
  setFormValue(document, "education", data.education)
  setFormValue(document, "languages", data.languages)
  setFormValue(document, "additional", data.additional)

  // Update form data
  updateFormData()

  logger.log("Form data after populateFormWithAnschreibenData:", formData)
  logger.log("Full name after update:", formData.fullName)
  logger.log("Address after update:", formData.address)

  // Show preview
  logger.log("About to show preview for bewerbung")
  await showPreview("bewerbung")

  // Re-add event listeners after data loading
  logger.log("Re-adding event listeners after Anschreiben data loading...")
  addFormEventListeners()
  logger.log("Event listeners re-added successfully")
}

// Populate form with Lebenslauf data
async function populateFormWithLebenslaufData(data) {
  logger.log("=== populateFormWithLebenslaufData called ===")
  logger.log("Current language:", currentLanguage)
  logger.log("Data received:", data)
  logger.log("Data type:", typeof data)
  logger.log("Data keys:", Object.keys(data))
  logger.log("Sample data values:")
  logger.log("  fullName:", data.fullName)
  logger.log("  nationality:", data.nationality)
  logger.log("  summary:", data.summary?.substring(0, 50) + "...")
  logger.log("Stack trace:", new Error().stack)

  try {
    // Switch to Lebenslauf tab
    logger.log("Switching to lebenslauf tab...")
    await switchFormTab("lebenslauf")
    logger.log("Switched to lebenslauf tab successfully")
  } catch (switchError) {
    logger.error("Error switching to lebenslauf tab:", switchError)
    // Don't throw the error, just log it and continue
    logger.log("Continuing without tab switch...")
  }

  // Personal info - populate both forms (data is direct, not nested in personalInfo)
  logger.log("Checking data.fullName:", data.fullName)
  if (data.fullName) {
    logger.log("Populating personal info fields...")

    // Bewerbung form
    const bewerbungForm = DOM.bewerbungForm
    logger.log("Bewerbung form found:", !!bewerbungForm)

    setFormValue(bewerbungForm, "fullName", data.fullName)
    setFormValue(bewerbungForm, "address", data.address)
    setFormValue(bewerbungForm, "phone", data.phone)
    setFormValue(bewerbungForm, "email", data.email)
    setFormValue(bewerbungForm, "birthDate", data.birthDate)
    setFormValue(bewerbungForm, "nationality", data.nationality)
    setFormValue(bewerbungForm, "residenceStatus", data.residenceStatus)

    // Lebenslauf form
    logger.log("Populating Lebenslauf form fields...")
    setFormValue(document, "lebenslaufFullName", data.fullName)
    setFormValue(document, "lebenslaufAddress", data.address)
    setFormValue(document, "lebenslaufPhone", data.phone)
    setFormValue(document, "lebenslaufEmail", data.email)
    setFormValue(document, "lebenslaufBirthDate", data.birthDate)
    setFormValue(document, "lebenslaufNationality", data.nationality)

    logger.log("Personal info fields populated")
  } else {
    logger.log("No fullName found in data, skipping personal info")
  }

  // Professional summary
  logger.log("Checking data.summary:", data.summary)
  if (data.summary) {
    logger.log("Setting summary field")
    setFormValue(document, "lebenslaufSummary", data.summary)
  }

  // Skills
  logger.log("Checking data.skills:", data.skills)
  if (data.skills) {
    const skillsText = Array.isArray(data.skills) ? data.skills.join("\n") : data.skills
    logger.log("Setting skills field:", skillsText)
    setFormValue(document, "lebenslaufSkills", skillsText)
  }

  // Experience
  logger.log("Checking data.experience:", data.experience)
  if (data.experience) {
    const experienceText = Array.isArray(data.experience)
      ? data.experience
          .map(exp => `${exp.position} | ${exp.company}\n${exp.period}\n${exp.description}`)
          .join("\n\n")
      : data.experience
    logger.log("Setting experience field:", experienceText)
    setFormValue(document, "lebenslaufExperience", experienceText)
  }

  // Education
  logger.log("Checking data.education:", data.education)
  if (data.education) {
    const educationText = Array.isArray(data.education)
      ? data.education.map(edu => `${edu.degree}\n${edu.institution}\n${edu.period}`).join("\n\n")
      : data.education
    logger.log("Setting education field:", educationText)
    setFormValue(document, "lebenslaufEducation", educationText)
  }

  // Certifications
  logger.log("Checking data.certifications:", data.certifications)
  if (data.certifications) {
    const certificationsText = Array.isArray(data.certifications)
      ? data.certifications.join("\n")
      : data.certifications
    logger.log("Setting certifications field:", certificationsText)
    setFormValue(document, "lebenslaufCertifications", certificationsText)
  }

  // Languages
  logger.log("Checking data.languages:", data.languages)
  if (data.languages) {
    const languagesText = Array.isArray(data.languages)
      ? data.languages.map(lang => `${lang.language} - ${lang.level}`).join("\n")
      : data.languages
    logger.log("Setting languages field:", languagesText)
    setFormValue(document, "lebenslaufLanguages", languagesText)
  }

  // Additional qualifications
  logger.log("Checking data.additional:", data.additional)
  if (data.additional) {
    const additionalText = Array.isArray(data.additional)
      ? data.additional.join("\n")
      : data.additional
    logger.log("Setting additional field:", additionalText)
    setFormValue(document, "lebenslaufAdditional", additionalText)
  }

  // Photo - Handle photo from JSON data
  logger.log("=== PHOTO HANDLING IN populateFormWithLebenslaufData ===")
  logger.log("Checking data.photo:", data.photo ? "Photo exists" : "No photo")
  logger.log("Current globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("Current formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  if (data.photo && typeof data.photo === "string") {
    logger.log("=== LOADING PHOTO FROM JSON DATA ===")
    logger.log("Photo data type:", typeof data.photo)
    logger.log("Photo data length:", data.photo.length)
    logger.log("Photo starts with data:image/:", data.photo.startsWith("data:image/"))

    // Save photo to global variable and formData
    globalPhotoData = data.photo
    formData.lebenslaufPhoto = data.photo
    formData.photo = data.photo

    // Display photo in preview
    const photoPreview = DOM.photoPreview
    if (photoPreview) {
      logger.log("Updating photo preview with loaded image")
      photoPreview.innerHTML = `<img src="${data.photo}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`

      // Show remove button
      const removePhotoBtn = DOM.removePhoto
      if (removePhotoBtn) {
        removePhotoBtn.style.display = "block"
        logger.log("Remove photo button shown")
      }
    } else {
      logger.log("Photo preview element not found")
    }

    logger.log("Photo loaded from JSON and saved to globalPhotoData and formData")
    saveFormData() // Save to localStorage
  } else {
    logger.log("=== NO PHOTO IN JSON DATA ===")
    logger.log("Preserving existing photo data...")

    // Preserve existing photo if no photo in JSON data
    if (globalPhotoData || formData.lebenslaufPhoto) {
      const existingPhoto = globalPhotoData || formData.lebenslaufPhoto
      logger.log("Preserving existing photo:", existingPhoto ? "Present" : "Missing")

      // Ensure photo is in both variables
      globalPhotoData = existingPhoto
      formData.lebenslaufPhoto = existingPhoto
      formData.photo = existingPhoto

      // Update photo preview
      const photoPreview = DOM.photoPreview
      if (photoPreview && existingPhoto) {
        logger.log("Updating photo preview with existing image")
        photoPreview.innerHTML = `<img src="${existingPhoto}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`

        // Show remove button
        const removePhotoBtn = DOM.removePhoto
        if (removePhotoBtn) {
          removePhotoBtn.style.display = "block"
          logger.log("Remove photo button shown")
        }
      }

      logger.log("Existing photo preserved and displayed")
    } else {
      logger.log("No existing photo to preserve")
    }
  }

  // Update preview
  logger.log("Updating preview...")
  try {
    await showPreview("lebenslauf")
    logger.log("Preview updated successfully")
  } catch (previewError) {
    logger.error("Error updating preview:", previewError)
    throw previewError
  }

  // Re-add event listeners after data loading
  logger.log("Re-adding event listeners after data loading...")
  addFormEventListeners()
  logger.log("Event listeners re-added successfully")
}

// Helper function to set form values
function setFormValue(form, fieldName, value) {
  let field
  if (form === document) {
    field = document.getElementById(fieldName)
  } else {
    field = form.querySelector(`[name="${fieldName}"]`)
  }

  if (field) {
    const oldValue = field.value
    logger.log(`🔄 setFormValue: ${fieldName}`)
    logger.log(`   Old value: "${oldValue}"`)
    logger.log(`   New value: "${value}"`)
    logger.log(`   Current language: ${currentLanguage}`)
    logger.log(`   Stack trace:`, new Error().stack.split("\n")[1])
    field.value = value
    // Trigger input event to update form data
    field.dispatchEvent(new Event("input", {bubbles: true}))
    logger.log(`Field ${fieldName} value after setting:`, field.value)
  } else {
    logger.log(`Field ${fieldName} not found`)
  }
}

// Switch between form tabs
async function switchFormTab(tabName) {
  logger.log("Switching to tab:", tabName)

  // Update tab buttons
  const tabButtons = document.querySelectorAll(".form-tab-button")
  logger.log("Found tab buttons:", tabButtons.length)
  tabButtons.forEach(button => button.classList.remove("active"))

  const activeButton = document.querySelector(
    `[onclick="switchFormTab('${tabName}').catch(console.error)"]`
  )
  logger.log("Active button found:", activeButton)
  if (activeButton) {
    activeButton.classList.add("active")
  }

  // Show/hide form sections
  const bewerbungSection = document.getElementById("bewerbungFormSection")
  const lebenslaufSection = DOM.lebenslaufSection

  logger.log("Bewerbung section:", bewerbungSection)
  logger.log("Lebenslauf section:", lebenslaufSection)

  if (tabName === "bewerbung") {
    if (bewerbungSection) bewerbungSection.style.display = "block"
    if (lebenslaufSection) lebenslaufSection.style.display = "none"
  } else if (tabName === "lebenslauf") {
    if (bewerbungSection) bewerbungSection.style.display = "none"
    if (lebenslaufSection) lebenslaufSection.style.display = "block"
  }

  // Update current preview type
  currentPreviewType = tabName

  // Update preview to show corresponding document
  logger.log("About to show preview for tab:", tabName)
  logger.log("Current preview type set to:", currentPreviewType)
  logger.log("Current formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  // Update form data before showing preview
  updateFormData()

  // Save current state
  saveFormData()

  // Immediately update preview for the active tab
  setTimeout(async () => {
    logger.log("About to show preview for tab:", tabName)
    logger.log("Current active tab after switch:", getCurrentActiveTab())
    await showPreview(tabName)
  }, 100)
}

// Update form data from all form inputs
function updateFormData() {
  logger.log("=== updateFormData called ===")

  // Preserve existing photo data before updating
  const existingPhoto = formData.lebenslaufPhoto || globalPhotoData

  logger.log("Existing photo data:", existingPhoto ? "Present" : "Missing")

  logger.log("Global photo data:", globalPhotoData ? "Present" : "Missing")

  // Update from main form
  const form = DOM.bewerbungForm
  if (form) {
    const formDataObj = new FormData(form)
    const newFormData = Object.fromEntries(formDataObj)
    logger.log("Main form data:", newFormData)
    logger.log("FormData entries:")
    for (let [key, value] of formDataObj.entries()) {
      logger.log(`${key}: ${value}`)
    }
    formData = {...formData, ...newFormData}
    logger.log("Updated formData:", formData)
  }

  // Also update by ID for specific Anschreiben fields
  const anschreibenFields = [
    "fullName",
    "address",
    "phone",
    "email",
    "birthDate",
    "nationality",
    "position",
    "company",
    "jobNumber",
    "contactName",
    "contactAddress",
    "contactPhone",
    "contactEmail",
    "subject",
    "motivation",
    "qualifications",
    "experience",
    "education",
    "languages",
    "additional"
  ]

  anschreibenFields.forEach(fieldId => {
    const element = document.getElementById(fieldId)
    if (element) {
      formData[fieldId] = element.value
      logger.log(`Updated Anschreiben field ${fieldId}:`, element.value)
    }
  })

  // Update from Lebenslauf section
  const lebenslaufSection = DOM.lebenslaufSection
  if (lebenslaufSection) {
    const lebenslaufInputs = lebenslaufSection.querySelectorAll("input, textarea, select")
    logger.log("Found Lebenslauf inputs:", lebenslaufInputs.length)
    lebenslaufInputs.forEach(input => {
      if (input.name) {
        logger.log(`Updating ${input.name}:`, input.value)
        formData[input.name] = input.value

        // Also map to main form fields for compatibility
        if (input.name === "lebenslaufFullName") {
          formData.fullName = input.value
        } else if (input.name === "lebenslaufAddress") {
          formData.address = input.value
        } else if (input.name === "lebenslaufPhone") {
          formData.phone = input.value
        } else if (input.name === "lebenslaufEmail") {
          formData.email = input.value
        } else if (input.name === "lebenslaufBirthDate") {
          formData.birthDate = input.value
        } else if (input.name === "lebenslaufNationality") {
          formData.nationality = input.value
        }
      }
    })
  }

  // Restore photo data if it existed
  if (existingPhoto) {
    formData.lebenslaufPhoto = existingPhoto
    logger.log("Photo data restored:", formData.lebenslaufPhoto ? "Yes" : "No")
    logger.log("Restored photo data:", formData.lebenslaufPhoto)
    logger.log("Restored photo data type:", typeof formData.lebenslaufPhoto)
    logger.log(
      "Restored photo data length:",
      formData.lebenslaufPhoto ? formData.lebenslaufPhoto.length : 0
    )
  } else {
    logger.log("No existing photo to restore")
  }

  logger.log("=== UPDATE FORM DATA DEBUG ===")
  logger.log("Final formData after updateFormData:", formData)
  logger.log("Final globalPhotoData after updateFormData:", globalPhotoData)
  logger.log("Photo in formData after updateFormData:", formData.lebenslaufPhoto)
  logger.log("Photo exists check:", formData.lebenslaufPhoto ? "Yes" : "No")
  logger.log("Photo type:", typeof formData.lebenslaufPhoto)
  logger.log("Photo length:", formData.lebenslaufPhoto ? formData.lebenslaufPhoto.length : 0)
  logger.log(
    "Photo starts with data:image/:",
    formData.lebenslaufPhoto && typeof formData.lebenslaufPhoto === "string"
      ? formData.lebenslaufPhoto.startsWith("data:image/")
      : false
  )
  logger.log(
    "Photo starts with blob:",
    formData.lebenslaufPhoto && typeof formData.lebenslaufPhoto === "string"
      ? formData.lebenslaufPhoto.startsWith("blob:")
      : false
  )

  // Save form data to localStorage
  saveFormData()
}

// Debounce function to prevent too many updates
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Auto-update preview when user types
async function updatePreviewOnInput() {
  logger.log("=== 🔄 updatePreviewOnInput called ===")
  logger.log("Timestamp:", new Date().toISOString())
  logger.log("Stack trace:", new Error().stack)

  try {
    // Update form data from all input fields using the new function
    logger.log("🔄 Calling getCurrentFormValues()...")
    const currentValues = getCurrentFormValues()
    formData = currentValues

    logger.log("🎯 Current preview type:", currentPreviewType)
    logger.log("📊 Form data after update:", {
      fullName: formData.fullName,
      address: formData.address,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate,
      lebenslaufPhoto: formData.lebenslaufPhoto ? "Present" : "Missing"
    })

    logger.log("📸 Global photo data:", globalPhotoData ? "Present" : "Missing")

    // Detailed photo analysis
    if (formData.lebenslaufPhoto) {
      logger.log("Lebenslauf photo details:")
      logger.log("- Type:", typeof formData.lebenslaufPhoto)
      logger.log("- Length:", formData.lebenslaufPhoto.length)
      if (typeof formData.lebenslaufPhoto === "string") {
        logger.log(
          "- Starts with data:image/:",
          formData.lebenslaufPhoto.startsWith("data:image/")
        )
        logger.log("- Starts with blob:", formData.lebenslaufPhoto.startsWith("blob:"))
      } else {
        logger.log("- Not a string, cannot check startsWith")
      }
    }

    // Determine which preview to show based on active tab
    const activeTab = getCurrentActiveTab()
    logger.log("Active tab determined:", activeTab)
    logger.log("Current form values:", getCurrentFormValues())

    // Update preview with current data using the active tab
    await showPreview(activeTab)
    // Recalculate proportional scale after preview updates
    setTimeout(updatePageScaleVar, 0)
    logger.log("✅ Preview updated successfully")
  } catch (error) {
    logger.error("❌ Error in updatePreviewOnInput:", error)
  }
}

// Debounced version of preview update
const debouncedUpdatePreview = debounce(() => {
  logger.log("🔄 ⚡ REAL-TIME debouncedUpdatePreview called")
  updatePreviewOnInput()
}, 150) // Зменшили з 300ms до 150ms для швидшого відгуку пагінації
// Photo upload functionality
function initializePhotoUpload() {
  logger.log("=== initializePhotoUpload called ===")
  logger.log("Current timestamp:", new Date().toISOString())
  logger.log("Document ready state:", document.readyState)

  const photoInput = DOM.lebenslaufPhoto
  const photoPreview = DOM.photoPreview
  const removePhotoBtn = DOM.removePhoto

  logger.log("Photo input found:", !!photoInput)
  logger.log("Photo input element:", photoInput)
  logger.log("Photo preview found:", !!photoPreview)
  logger.log("Photo preview element:", photoPreview)
  logger.log("Remove photo button found:", !!removePhotoBtn)
  logger.log("Remove photo button element:", removePhotoBtn)

  // Check if elements are in DOM
  logger.log("Photo input in DOM:", document.contains(photoInput))
  logger.log("Photo preview in DOM:", document.contains(photoPreview))

  if (photoInput && photoPreview) {
    logger.log("✅ Photo input and preview found, adding event listener")
    logger.log("Photo input ID:", photoInput.id)
    logger.log("Photo input type:", photoInput.type)
    logger.log("Photo input name:", photoInput.name)
    photoInput.addEventListener("change", function (e) {
      logger.log("=== PHOTO INPUT CHANGE EVENT TRIGGERED ===")
      logger.log("Event:", e)
      logger.log("Target:", e.target)
      logger.log("Files:", e.target.files)
      logger.log("Files length:", e.target.files ? e.target.files.length : "no files")

      const file = e.target.files[0]
      logger.log("Selected file:", file)
      if (file) {
        // Show loading indicator
        photoPreview.innerHTML = `
                <div class="photo-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
                  <div class="loading-spinner" style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;"></div>
                  <span style="color: #6c757d; font-size: 14px;">Завантаження фото...</span>
                </div>
              `

        // Validate file type
        if (!file.type.startsWith("image/")) {
          const errorMsg =
            getTranslation("errors.invalidFileType") || "Будь ласка, виберіть файл зображення"
          alert(errorMsg)
          return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          const errorMsg =
            getTranslation("errors.fileTooLarge") ||
            "Файл занадто великий. Максимальний розмір: 5MB"
          alert(errorMsg)
          return
        }

        // Additional validation
        if (file.size === 0) {
          alert("Файл порожній")
          return
        }

        logger.log("Processing photo file:", file.name, file.type, file.size)

        const reader = new FileReader()

        reader.onload = function (e) {
          try {
            logger.log("=== PHOTO LOADED SUCCESSFULLY ===")
            logger.log("Event:", e)
            logger.log("Target:", e.target)
            logger.log("Result type:", typeof e.target.result)
            logger.log("Result length:", e.target.result ? e.target.result.length : "no result")

            const result = e.target.result

            // Validate that we got a proper data URL
            if (!result || typeof result !== "string" || !result.startsWith("data:image/")) {
              throw new Error("Invalid image data received")
            }

            logger.log("Photo data URL length:", result.length)
            logger.log("Photo data URL starts with:", result.substring(0, 50))

            // Show success indicator
            photoPreview.innerHTML = `
                    <div class="photo-success" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #d4edda; border: 2px solid #c3e6cb; border-radius: 8px;">
                      <div style="color: #155724; font-size: 24px; margin-bottom: 10px;">✅</div>
                      <span style="color: #155724; font-size: 14px;">Фото завантажено успішно!</span>
                    </div>
                  `

            // Wait a moment then show the actual image
            setTimeout(() => {
              logger.log("=== DISPLAYING PHOTO ===")
              logger.log("Setting photoPreview.innerHTML with image")
              photoPreview.innerHTML = `<img src="${result}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`
              logger.log("Photo preview updated, checking if image is visible")

              // Check if image is actually visible
              const img = photoPreview.querySelector("img")
              logger.log("Image element:", img)
              logger.log("Image src:", img ? img.src : "no image")
              logger.log("Image complete:", img ? img.complete : "no image")
              logger.log("Image naturalWidth:", img ? img.naturalWidth : "no image")
              logger.log("Image naturalHeight:", img ? img.naturalHeight : "no image")

              if (removePhotoBtn) {
                removePhotoBtn.style.display = "block"
                logger.log("Remove photo button shown")
              }
            }, 1000)

            // Update form data with photo
            formData.lebenslaufPhoto = result
            globalPhotoData = result // Also save to global variable
            logger.log("=== PHOTO UPLOAD DEBUG ===")
            logger.log("Photo uploaded and saved to formData and globalPhotoData")
            logger.log("Current formData after photo upload:", formData)
            logger.log("Current globalPhotoData after photo upload:", globalPhotoData)
            logger.log("Photo type:", typeof result)
            logger.log("Photo length:", result.length)
            logger.log("Photo starts with data:image/:", result.startsWith("data:image/"))
            saveFormData() // Save to localStorage
            updatePreviewOnInput()
          } catch (error) {
            logger.error("Error displaying photo:", error)
            const errorMsg =
              getTranslation("errors.photoDisplayError") || "Помилка при відображенні фото"
            alert(errorMsg)
          }
        }

        reader.onerror = function (error) {
          logger.error("Error reading file:", error)
          const errorMsg = getTranslation("errors.fileReadError") || "Помилка при читанні файлу"
          alert(errorMsg)
        }

        reader.onabort = function (error) {
          logger.error("File read aborted:", error)
          alert("Читання файлу перервано")
        }

        try {
          logger.log("Starting to read file as data URL...")
          reader.readAsDataURL(file)
        } catch (error) {
          logger.error("Error starting file read:", error)

          // Fallback: try using URL.createObjectURL
          try {
            logger.log("Trying fallback method with URL.createObjectURL...")
            const objectURL = URL.createObjectURL(file)
            logger.log("Object URL created:", objectURL)

            photoPreview.innerHTML = `<img src="${objectURL}" alt="Uploaded photo" />`
            if (removePhotoBtn) {
              removePhotoBtn.style.display = "block"
            }

            // Update form data with object URL
            formData.lebenslaufPhoto = objectURL
            globalPhotoData = objectURL // Also save to global variable
            logger.log("Photo uploaded using fallback method and saved to globalPhotoData")
            logger.log("Current formData after fallback photo upload:", formData)
            logger.log("Current globalPhotoData after fallback photo upload:", globalPhotoData)
            saveFormData() // Save to localStorage
            updatePreviewOnInput()
          } catch (fallbackError) {
            logger.error("Fallback method also failed:", fallbackError)
            const errorMsg =
              getTranslation("errors.fileUploadError") || "Помилка при завантаженні файлу"
            alert(errorMsg)
          }
        }
      }
    })
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", function () {
      photoInput.value = ""

      // Clean up object URL if it exists
      if (
        formData.lebenslaufPhoto &&
        typeof formData.lebenslaufPhoto === "string" &&
        formData.lebenslaufPhoto.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.lebenslaufPhoto)
      }

      photoPreview.innerHTML = `
                    <div class="photo-placeholder">
                      <span class="photo-icon">📷</span>
                      <span data-translate="lebenslauf.photoPlaceholder">Foto hochladen</span>
                    </div>
                  `
      removePhotoBtn.style.display = "none"

      // Remove photo from form data
      delete formData.lebenslaufPhoto
      globalPhotoData = null // Also clear global variable
      saveFormData() // Save to localStorage
      updatePreviewOnInput()
    })
  }

  logger.log("=== initializePhotoUpload completed ===")
  logger.log("Event listener added:", photoInput ? "Yes" : "No")
  logger.log("Photo preview element ready:", photoPreview ? "Yes" : "No")

  if (!photoInput || !photoPreview) {
    logger.log("❌ Photo upload initialization failed:")
    logger.log("  Photo input found:", !!photoInput)
    logger.log("  Photo preview found:", !!photoPreview)
    if (!photoInput) {
      logger.log(
        "  ❌ Photo input element not found - check if element with ID 'lebenslaufPhoto' exists"
      )
    }
    if (!photoPreview) {
      logger.log(
        "  ❌ Photo preview element not found - check if element with ID 'photoPreview' exists"
      )
    }
  }
}
function initializeForm() {
  // Try to load saved data first
  const dataLoaded = loadFormData()

  // Видаляємо небажаний текст "Station Service Angestellter"
  removeUnwantedPositionText()

  if (!dataLoaded) {
    // If no saved data, initialize with form values
    const form = DOM.bewerbungForm
    const formDataObj = new FormData(form)
    formData = Object.fromEntries(formDataObj)
  }

  // Add event listeners for real-time preview updates
  addFormEventListeners()
}

// Add event listeners to form fields for real-time updates
function addFormEventListeners() {
  logger.log("=== addFormEventListeners called ===")

  // Remove existing listeners first to avoid duplicates
  removeFormEventListeners()

  // Add listeners to all forms and sections
  const sections = [
    DOM.bewerbungForm,
    DOM.lebenslaufSection
  ]

  let totalListenersAdded = 0

  sections.forEach(section => {
    if (section) {
      const inputs = section.querySelectorAll("input, textarea, select")
      logger.log(`Adding listeners to ${section.id}:`, inputs.length, "inputs")

      inputs.forEach(input => {
        // Add multiple event listeners for better tracking
        input.addEventListener("input", e => {
          logger.log(`🔄 Input event on ${input.name || input.id}:`, e.target.value)
          logger.log(`🔄 Calling debouncedUpdatePreview from input event`)
          debouncedUpdatePreview()
        })
        input.addEventListener("change", e => {
          logger.log(`🔄 Change event on ${input.name || input.id}:`, e.target.value)
          logger.log(`🔄 Calling debouncedUpdatePreview from change event`)
          debouncedUpdatePreview()
        })
        input.addEventListener("keyup", e => {
          logger.log(`🔄 Keyup event on ${input.name || input.id}:`, e.target.value)
          logger.log(`🔄 Calling debouncedUpdatePreview from keyup event`)
          debouncedUpdatePreview()
        })
        input.addEventListener("paste", () => {
          logger.log(`🔄 Paste event on ${input.name || input.id}`)
          // Small delay to allow paste content to be processed
          setTimeout(debouncedUpdatePreview, 10)
        })

        // Additional listeners for better synchronization
        if (input.type === "radio" || input.type === "checkbox") {
          input.addEventListener("click", e => {
            logger.log(`🔄 Click event on ${input.name || input.id}:`, e.target.checked)
            debouncedUpdatePreview()
          })
        }

        // For select elements
        if (input.tagName.toLowerCase() === "select") {
          input.addEventListener("focus", () => {
            logger.log(`🔄 Focus event on ${input.name || input.id}`)
          })
          input.addEventListener("blur", () => {
            logger.log(`🔄 Blur event on ${input.name || input.id}`)
            debouncedUpdatePreview()
          })
        }

        totalListenersAdded++
      })
    } else {
      logger.log(`❌ Section not found: ${section ? section.id : "undefined"}`)
    }
  })

  logger.log(`✅ Total event listeners added: ${totalListenersAdded}`)
  logger.log("=== addFormEventListeners completed ===")
}

// Remove existing event listeners to prevent duplicates
function removeFormEventListeners() {
  const sections = [
    DOM.bewerbungForm,
    DOM.lebenslaufSection
  ]

  sections.forEach(section => {
    if (section) {
      const inputs = section.querySelectorAll("input, textarea, select")
      inputs.forEach(input => {
        // Clone the input to remove all event listeners
        const newInput = input.cloneNode(true)
        input.parentNode.replaceChild(newInput, input)
      })
    }
  })
}

// Show status message
function showStatus(message, type = "info") {
  const statusEl = DOM.statusMessage

  // Clear any existing timeout
  if (statusEl.timeoutId) {
    clearTimeout(statusEl.timeoutId)
  }

  statusEl.textContent = message
  statusEl.className = `status-message status-${type}`
  statusEl.style.display = "block"

  // Set timeout to hide the message (increased to 10 seconds)
  statusEl.timeoutId = setTimeout(() => {
    statusEl.style.display = "none"
    statusEl.timeoutId = null
  }, 10000)
}

// Clear status message immediately
function clearStatus() {
  const statusEl = DOM.statusMessage
  if (statusEl.timeoutId) {
    clearTimeout(statusEl.timeoutId)
    statusEl.timeoutId = null
  }
  statusEl.style.display = "none"
  statusEl.textContent = ""
}

// Generate preview
async function generatePreview() {
  const form = DOM.bewerbungForm
  const formDataObj = new FormData(form)
  formData = Object.fromEntries(formDataObj)

  showStatus("Vorschau wird generiert...", "info")

  // Show preview immediately
  await showPreview("bewerbung")

  // Simulate preview generation
  setTimeout(() => {
    showStatus("Vorschau erfolgreich generiert!", "success")
  }, 1000)
}

// Show preview tab
// Функція автоматичного розподілу контенту на сторінки
function createMultiPagePreview(content) {
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = content
  tempDiv.style.position = "absolute"
  tempDiv.style.top = "-9999px"
  tempDiv.style.width = "170mm" // 210mm - 40mm padding
  tempDiv.style.fontSize = "11pt"
  tempDiv.style.lineHeight = "1.5"
  tempDiv.style.fontFamily = "Times New Roman, serif"
  tempDiv.className = "document-preview"
  document.body.appendChild(tempDiv)

  const maxHeight = 257 // 297mm - 40mm padding = 257mm approx
  const pages = []
  const elements = Array.from(tempDiv.children)

  let currentPageContent = []
  let currentHeight = 0

  for (let element of elements) {
    const elementHeight = element.offsetHeight + 10 // додаємо відступ

    // Якщо елемент не поміщається на поточній сторінці
    if (currentHeight + elementHeight > maxHeight && currentPageContent.length > 0) {
      pages.push(currentPageContent.join(""))
      currentPageContent = []
      currentHeight = 0
    }

    currentPageContent.push(element.outerHTML)
    currentHeight += elementHeight
  }

  // Додаємо останню сторінку
  if (currentPageContent.length > 0) {
    pages.push(currentPageContent.join(""))
  }

  document.body.removeChild(tempDiv)

  // Створюємо HTML для декількох сторінок
  return pages
    .map(
      (pageContent, index) => `
          <div class="document-page">
            <div class="document-preview">
              ${pageContent}
            </div>
          </div>
        `
    )
    .join("")
}

// Function to get current active form tab
// getCurrentActiveTab - DELEGATED TO PreviewService
function getCurrentActiveTab() {
  return previewService.getCurrentActiveTab();
}
// Function to get current form values dynamically based on active tab
// getCurrentFormValues - DELEGATED TO PreviewService
function getCurrentFormValues() {
  return previewService.getCurrentFormValues();
}

// Нова покращена методика динамічної пагінації на основі висоти A4
function performIntelligentPagination(htmlContent, charactersPerPage, activeTab) {
  logger.log("📄 🧠 NEW Height-based A4 pagination method starting")

  try {
    // Створюємо прихований контейнер для вимірювання висоти
    const measureContainer = document.createElement("div")
    measureContainer.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: 170mm;
            padding: 15mm;
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
          `
    document.body.appendChild(measureContainer)
    measureContainer.innerHTML = htmlContent

    // Витягуємо стилі окремо
    const styles = measureContainer.querySelectorAll("style")
    const styleContent = Array.from(styles)
      .map(s => s.outerHTML)
      .join("\n")

    // Видаляємо стилі з контейнера для обробки контенту
    styles.forEach(style => style.remove())

    // Збираємо всі елементи для розподілу
    const allElements = Array.from(measureContainer.children)

    if (allElements.length === 0) {
      logger.log("📄 ⚠️ No elements found in content")
      document.body.removeChild(measureContainer)
      return wrapInPage(htmlContent, 1)
    }

    logger.log(`📄 📊 Analysis:`)
    logger.log(`📄   Total elements: ${allElements.length}`)
    logger.log(`📄   Container height: ${measureContainer.scrollHeight}px`)

    // A4 висота в пікселях (приблизно 1122px при 96 DPI мінус поля)
    // Залишаємо місце для полів: верх 15mm, низ 15mm = 30mm = ~113px
    const MAX_PAGE_HEIGHT = 950 // пікселі для контенту на одній сторінці A4

    // Розподіляємо елементи по сторінках на основі висоти
    const pages = []
    let currentPage = []
    let currentPageHeight = 0

    // Створюємо тимчасовий контейнер для вимірювання висоти окремих елементів
    const tempMeasure = document.createElement("div")
    tempMeasure.style.cssText = measureContainer.style.cssText
    document.body.appendChild(tempMeasure)

    for (const element of allElements) {
      // Вимірюємо висоту елемента
      tempMeasure.innerHTML = ""
      tempMeasure.appendChild(element.cloneNode(true))
      const elementHeight = tempMeasure.scrollHeight

      // Перевіряємо чи елемент є заголовком або важливим блоком
      const isHeading = /^H[1-6]$/i.test(element.tagName)
      const isSection =
        element.classList.contains("section") ||
        element.classList.contains("profile-header") ||
        element.classList.contains("section-header")

      // Логіка розподілу по сторінках
      if (currentPageHeight + elementHeight > MAX_PAGE_HEIGHT && currentPage.length > 0) {
        // Якщо це заголовок і на сторінці вже є достатньо контенту - переносимо на наступну
        if (isHeading && currentPageHeight > MAX_PAGE_HEIGHT * 0.6) {
          pages.push([...currentPage])
          currentPage = [element]
          currentPageHeight = elementHeight
          logger.log(`📄   Page ${pages.length} completed: ${currentPageHeight}px`)
        }
        // Якщо це важлива секція і вона не поміститься - переносимо
        else if (isSection && elementHeight > MAX_PAGE_HEIGHT * 0.4) {
          pages.push([...currentPage])
          currentPage = [element]
          currentPageHeight = elementHeight
          logger.log(`📄   Page ${pages.length} completed (section break): ${currentPageHeight}px`)
        }
        // Інакше намагаємось помістити, якщо не дуже великий
        else if (elementHeight < MAX_PAGE_HEIGHT * 0.3) {
          currentPage.push(element)
          currentPageHeight += elementHeight
        }
        // Якщо елемент занадто великий - починаємо нову сторінку
        else {
          pages.push([...currentPage])
          currentPage = [element]
          currentPageHeight = elementHeight
          logger.log(`📄   Page ${pages.length} completed: ${currentPageHeight}px`)
        }
      } else {
        // Додаємо елемент на поточну сторінку
        currentPage.push(element)
        currentPageHeight += elementHeight
      }

      logger.log(
        `📄   Element: ${element.tagName}, height: ${elementHeight}px, page height: ${currentPageHeight}px`
      )
    }

    // Додаємо останню сторінку
    if (currentPage.length > 0) {
      pages.push(currentPage)
      logger.log(`📄   Last page completed: ${currentPageHeight}px`)
    }

    // Видаляємо тимчасові контейнери
    document.body.removeChild(measureContainer)
    document.body.removeChild(tempMeasure)

    // Якщо отримали тільки одну сторінку - повертаємо як є
    if (pages.length <= 1) {
      logger.log("📄 ✅ Content fits on single page")
      return wrapInPage(htmlContent, 1)
    }

    logger.log(`📄   Total pages created: ${pages.length}`)

    // Генеруємо HTML для кожної сторінки
    let paginatedHTML = ""
    for (let i = 0; i < pages.length; i++) {
      const pageElements = pages[i]
      const pageContent = pageElements.map(el => el.outerHTML).join("\n")

      logger.log(`📄   Page ${i + 1}: ${pageElements.length} elements`)

      paginatedHTML += `
              <div class="document-page print-like page-${i + 1}" data-page="${i + 1}" data-total-pages="${pages.length}">
                <div class="document-preview">
                  ${styleContent}
                  ${pageContent}
                </div>
              </div>
            `
    }

    logger.log(`📄 ✅ Height-based pagination complete: ${pages.length} pages created`)
    return paginatedHTML
  } catch (error) {
    logger.error("📄 ❌ Error in height-based pagination:", error)

    // Cleanup якщо виникла помилка
    const tempContainers = document.querySelectorAll('div[style*="visibility: hidden"]')
    tempContainers.forEach(container => {
      if (container.parentNode === document.body) {
        document.body.removeChild(container)
      }
    })

    // Fallback - повертаємо оригінальний контент
    return wrapInPage(htmlContent, 1)
  }
}
// Покращена пагінація: складання сторінок у прихованій A4-рамці (з точними полями)
function performFrameBasedPagination(htmlContent, activeTab) {
  logger.log("📄 🧠 FRAME-based A4 pagination starting…")

  // Парсимо HTML та відокремлюємо стилі, щоб інлайнити їх на кожній сторінці
  const parser = document.createElement("div")
  parser.innerHTML = htmlContent
  const styleNodes = parser.querySelectorAll("style")
  const styleContent = Array.from(styleNodes)
    .map(s => s.outerHTML)
    .join("\n")
  styleNodes.forEach(s => s.remove())

  const sourceElements = Array.from(parser.children)
  if (sourceElements.length === 0) {
    return wrapInPage(htmlContent, 1)
  }

  // Створюємо мінімалістичну вимірювальну рамку (без сторонніх стилів)
  const frame = document.createElement("div")
  frame.style.position = "fixed"
  frame.style.visibility = "hidden"
  frame.style.left = "-10000px"
  frame.style.top = "-10000px"
  frame.style.width = "210mm"
  frame.style.padding = "20mm 15mm" // поля A4 як у друці
  frame.style.boxSizing = "border-box"
  frame.style.transform = "none"
  frame.style.overflow = "visible"

  const framePreview = document.createElement("div")
  framePreview.style.width = "100%"
  framePreview.style.height = "257mm" // 297 - 40
  framePreview.style.overflow = "visible"
  frame.appendChild(framePreview)

  // Додаємо обгортку з тими ж класами стилю/лейаута, що і у прев'ю,
  // щоби селектори типу `.resume-style-xxx .document-preview h2` застосувались під час вимірювання
  const previewSectionEl = document.querySelector(".preview-section")
  const wrapper = document.createElement("div")
  if (previewSectionEl) {
    const classes = Array.from(previewSectionEl.classList)
    const styleClass = classes.find(c => c.startsWith("resume-style-"))
    const layoutClass = classes.find(c => c.startsWith("layout-"))
    ;[styleClass, layoutClass].filter(Boolean).forEach(cls => wrapper.classList.add(cls))
  }
  wrapper.appendChild(frame)
  document.body.appendChild(wrapper)

  const pagesHTML = []

  const availableHeight = framePreview.clientHeight

  const pushPage = () => {
    pagesHTML.push(`
              <div class="document-page print-like">
                <div class="document-preview">
                  ${styleContent}
                  ${framePreview.innerHTML}
                </div>
              </div>
            `)
    framePreview.innerHTML = ""
  }

  const blockTags = new Set([
    "P",
    "DIV",
    "SECTION",
    "ARTICLE",
    "UL",
    "OL",
    "LI",
    "TABLE",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6"
  ])

  // Розплющуємо .document-preview, зберігаючи структуру контейнерів
  const flatElements = []
  for (const sec of sourceElements) {
    if (sec.classList && sec.classList.contains("document-preview")) {
      // Витягуємо дочірні елементи з .document-preview
      Array.from(sec.children).forEach(ch => {
        // Пропускаємо <style>, він вже витягнутий у styleContent
        if (ch.tagName !== "STYLE") {
          flatElements.push(ch.cloneNode(true))
        }
      })
    } else {
      flatElements.push(sec.cloneNode(true))
    }
  }

  for (const original of flatElements) {
    let el = original.cloneNode(true)

    // Якщо елемент має дочірні блокові елементи (наприклад, div.content з параграфами),
    // розбиваємо його на дочірні елементи замість того, щоб обробляти цілим блоком
    const hasBlockChildren = Array.from(el.children || []).some(child =>
      blockTags.has(child.tagName)
    )

    if (hasBlockChildren) {
      // Розбиваємо на дочірні елементи зі збереженням структури
      const children = Array.from(el.children)
      const containerTag = el.tagName
      const containerClasses = el.className
      const containerStyle = el.getAttribute('style') || ''

      // Створюємо контейнер для кожної сторінки
      let pageContainer = document.createElement(containerTag)
      pageContainer.className = containerClasses
      if (containerStyle) pageContainer.setAttribute('style', containerStyle)
      framePreview.appendChild(pageContainer)

      for (const child of children) {
        const childClone = child.cloneNode(true)
        pageContainer.appendChild(childClone)

        // Перевіряємо переповнення після додавання
        if (framePreview.scrollHeight > availableHeight) {
          // Видаляємо елемент, що не поміщається
          pageContainer.removeChild(childClone)

          // Якщо контейнер не порожній, зберігаємо сторінку
          if (pageContainer.children.length > 0) {
            pushPage()
            // Створюємо новий контейнер для наступної сторінки
            pageContainer = document.createElement(containerTag)
            pageContainer.className = containerClasses
            if (containerStyle) pageContainer.setAttribute('style', containerStyle)
            framePreview.appendChild(pageContainer)
          }

          // Додаємо елемент на нову сторінку
          pageContainer.appendChild(childClone)

          // Якщо елемент все ще не поміщається, розбиваємо його
          if (framePreview.scrollHeight > availableHeight) {
            // Перевіряємо чи елемент має вкладену структуру (наприклад, experience-item > div)
            const hasNestedContent = childClone.children.length > 0;

            if (hasNestedContent) {
              // Якщо елемент має вкладені дочірні елементи, зберігаємо структуру
              pageContainer.removeChild(childClone);

              // Зберігаємо всі атрибути елемента
              const childTag = childClone.tagName;
              const childClasses = childClone.className;
              const childStyle = childClone.getAttribute('style') || '';

              let currentWrapper = document.createElement(childTag);
              currentWrapper.className = childClasses;
              if (childStyle) currentWrapper.setAttribute('style', childStyle);
              pageContainer.appendChild(currentWrapper);

              // Обробляємо кожен вкладений елемент
              for (const nested of Array.from(childClone.children)) {
                const nestedClone = nested.cloneNode(true);
                currentWrapper.appendChild(nestedClone);

                if (framePreview.scrollHeight > availableHeight) {
                  currentWrapper.removeChild(nestedClone);

                  // Створюємо нову сторінку
                  pushPage();
                  pageContainer = document.createElement(containerTag);
                  pageContainer.className = containerClasses;
                  if (containerStyle) pageContainer.setAttribute('style', containerStyle);
                  framePreview.appendChild(pageContainer);

                  currentWrapper = document.createElement(childTag);
                  currentWrapper.className = childClasses;
                  if (childStyle) currentWrapper.setAttribute('style', childStyle);
                  pageContainer.appendChild(currentWrapper);
                  currentWrapper.appendChild(nestedClone);
                }
              }
            } else if (childClone.textContent && childClone.textContent.trim().length > 0) {
              // Якщо це текстовий елемент без вкладених тегів, розбиваємо по словах
              pageContainer.removeChild(childClone)
              const words = childClone.textContent.trim().split(/\s+/)

              let currentText = ""
              for (let i = 0; i < words.length; i++) {
                const testText = currentText ? currentText + " " + words[i] : words[i]
                const testEl = childClone.cloneNode(false)
                testEl.textContent = testText
                pageContainer.appendChild(testEl)

                if (framePreview.scrollHeight > availableHeight && currentText) {
                  // Зберігаємо поточну частину
                  pageContainer.removeChild(testEl)
                  const finalEl = childClone.cloneNode(false)
                  finalEl.textContent = currentText
                  pageContainer.appendChild(finalEl)

                  // Створюємо нову сторінку
                  pushPage()
                  pageContainer = document.createElement(containerTag)
                  pageContainer.className = containerClasses
                  if (containerStyle) pageContainer.setAttribute('style', containerStyle)
                  framePreview.appendChild(pageContainer)

                  // Починаємо з поточного слова
                  currentText = words[i]
                  const newEl = childClone.cloneNode(false)
                  newEl.textContent = currentText
                  pageContainer.appendChild(newEl)
                } else {
                  currentText = testText
                  pageContainer.removeChild(testEl)
                }
              }

              // Додаємо залишок
              if (currentText) {
                const finalEl = childClone.cloneNode(false)
                finalEl.textContent = currentText
                pageContainer.appendChild(finalEl)
              }
            }
          }
        }
      }

      // Не потрібно обробляти далі, переходимо до наступного
      continue
    }

    framePreview.appendChild(el)

    // Якщо помістилось — продовжуємо
    if (framePreview.scrollHeight <= availableHeight) {
      continue
    }

    // Інакше — елемент переповнив сторінку
    // Спочатку намагаємось ДОзаповнити залишок поточної сторінки частиною елемента (розбиття по словах)
    if (el.parentNode === framePreview) framePreview.removeChild(el)
    const hasContentOnPage =
      framePreview.innerHTML && framePreview.innerHTML.replace(/\s/g, "") !== ""
    if (
      hasContentOnPage &&
      blockTags.has(el.tagName) &&
      el.textContent &&
      el.textContent.trim().length > 0
    ) {
      const words = el.textContent.trim().split(/\s+/)
      let low = 1
      let high = words.length
      let best = 0
      const testNode = el.cloneNode(false)
      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        testNode.textContent = words.slice(0, mid).join(" ")
        framePreview.appendChild(testNode)
        if (framePreview.scrollHeight <= availableHeight) {
          best = mid
          framePreview.removeChild(testNode)
          low = mid + 1
        } else {
          framePreview.removeChild(testNode)
          high = mid - 1
        }
      }

      if (best > 0) {
        const firstPart = el.cloneNode(false)
        firstPart.textContent = words.slice(0, best).join(" ")
        framePreview.appendChild(firstPart)
        pushPage()
        const remainder = el.cloneNode(false)
        remainder.textContent = words.slice(best).join(" ")
        el = remainder
      } else {
        // якщо нічого не поміщається — просто закриваємо сторінку
        pushPage()
      }
    } else if (hasContentOnPage) {
      // інші елементи переносимо на наступну сторінку
      pushPage()
    }

    // Розпочинаємо нову сторінку і пробуємо додати елемент першим
    framePreview.appendChild(el)

    // Якщо елемент помістився як перший на сторінці — ок
    if (framePreview.scrollHeight <= availableHeight) {
      continue
    }

    // Якщо елемент все ще завеликий — спробуємо розбити текст за словами
    if (el.parentNode === framePreview) framePreview.removeChild(el)
    if (blockTags.has(el.tagName) && el.textContent && el.textContent.trim().length > 0) {
      const words = el.textContent.trim().replace(/\s+/g, " ").split(" ")
      let index = 0

      while (index < words.length) {
        let part = ""
        const testNode = el.cloneNode(false)

        // Набираємо слова, доки вміщується
        while (index < words.length) {
          const candidate = part ? part + " " + words[index] : words[index]
          testNode.textContent = candidate
          framePreview.appendChild(testNode)

          if (framePreview.scrollHeight <= availableHeight) {
            part = candidate
            if (testNode.parentNode === framePreview) framePreview.removeChild(testNode)
            index++
          } else {
            // Фіксуємо сторінку з тим, що помістилось
            const finalNode = el.cloneNode(false)
            finalNode.textContent = part || words[index]
            framePreview.appendChild(finalNode)
            pushPage()
            // Якщо нічого не помістилось — просуваємось хоча б на одне слово
            if (!part) index++
            break
          }
        }

        // Якщо усі слова розміщені й ще є залишок у буфері — додаємо його
        if (index >= words.length && part) {
          const finalNode2 = el.cloneNode(false)
          finalNode2.textContent = part
          framePreview.appendChild(finalNode2)
        }
      }
    } else {
      // Нетривіальні елементи (таблиці тощо) — переносимо цілим блоком
      framePreview.appendChild(el)
      pushPage()
    }
  }

  // Додаємо останню сторінку, якщо є контент
  if (framePreview.innerHTML.trim() !== "") {
    pushPage()
  }

  // Прибирання службової рамки
  if (wrapper && wrapper.parentNode) {
    wrapper.parentNode.removeChild(wrapper)
  } else {
    document.body.removeChild(frame)
  }

  logger.log(`📄 ✅ FRAME-based pagination complete: ${pagesHTML.length} pages`)
  return pagesHTML.join("") || wrapInPage(htmlContent, 1)
}

// Допоміжна функція для обгортання контенту в сторінку
function wrapInPage(content, pageNum) {
  return `
            <div class="document-page print-like page-${pageNum}">
              <div class="document-preview">
                ${content}
              </div>
            </div>
          `
}

async function showPreview(type) {
  return await previewService.showPreview(type, globalPhotoData);
}

// Функція для розрахунку кількості рядків тексту
function calculateTextLines(text, maxWidth = 170) {
  if (!text) return 0

  // Приблизний розрахунок: 1 символ ≈ 0.6mm при 11pt шрифті
  const charsPerLine = Math.floor(maxWidth / 0.6)
  const lines = Math.ceil(text.length / charsPerLine)

  // Мінімум 1 рядок для непустого тексту
  return Math.max(1, lines)
}

// Функція для розподілу контенту на сторінки (42 рядки на сторінку)
function distributeContentToPages(content, maxLinesPerPage = 42) {
  const pages = []
  let currentPageLines = 0
  let currentPageContent = []

  for (const section of content) {
    const sectionLines = section.lines

    // Якщо секція не поміщається на поточну сторінку
    if (currentPageLines + sectionLines > maxLinesPerPage && currentPageContent.length > 0) {
      pages.push(currentPageContent)
      currentPageContent = []
      currentPageLines = 0
    }

    currentPageContent.push(section)
    currentPageLines += sectionLines
  }

  // Додаємо останню сторінку
  if (currentPageContent.length > 0) {
    pages.push(currentPageContent)
  }

  return pages
}

// Generate documents (Vanilla JS version)
async function generateDocuments() {
  const form = DOM.bewerbungForm
  const formDataObj = new FormData(form)
  formData = Object.fromEntries(formDataObj)

  // Додаємо фото до formData якщо воно є
  if (globalPhotoData) {
    formData.photo = globalPhotoData
    formData.lebenslaufPhoto = globalPhotoData
  }

  logger.log("Generate Documents - FormData with photo:", {
    hasPhoto: !!formData.photo,
    hasLebenslaufPhoto: !!formData.lebenslaufPhoto,
    globalPhotoData: !!globalPhotoData
  })

  showStatus("Dokumente werden generiert...", "info")

  try {
    // Get current active tab
    const activeTab = getCurrentActiveTab()
    logger.log("Generating documents for active tab:", activeTab)

    // Generate HTML content only for active tab
    let htmlContent = ""
    let documentType = ""

    if (activeTab === "bewerbung") {
      htmlContent = generateBewerbungHTML(formData)
      documentType = "Bewerbung"
    } else if (activeTab === "lebenslauf") {
      htmlContent = generateLebenslaufHTML(formData)
      documentType = "Lebenslauf"
    }

    if (!htmlContent) {
      showStatus("Немає контенту для генерації", "error")
      return
    }

    // Create timestamp and filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const name = formData.fullName ? formData.fullName.replace(/\s+/g, "_") : "Dokument"

    // Generate all formats for active tab only
    const promises = []

    // HTML file
    promises.push(
      downloadFile(`${documentType}_${name}_${timestamp}.html`, htmlContent, "text/html")
    )

    // PDF file
    promises.push(generatePDF(htmlContent, `${documentType}_${name}_${timestamp}.pdf`))

    // DOCX file
    promises.push(generateDOCX(htmlContent, `${documentType}_${name}_${timestamp}.docx`))

    // Wait for all downloads to complete
    await Promise.allSettled(promises)

    showStatus(
      `${documentType} erfolgreich erstellt und heruntergeladen! (HTML, PDF, DOCX)`,
      "success"
    )

    // Update status message
    const statusEl = DOM.statusMessage
    statusEl.innerHTML = `
                  <div style="margin-top: 10px;">
                    <strong>✅ ${documentType} erfolgreich erstellt:</strong><br>
                    • HTML-Datei (für Browser-Anzeige)<br>
                    • PDF-Datei (für Druck und E-Mail)<br>
                    • DOCX-Datei (für Microsoft Word)<br><br>
                    <strong>Hinweis:</strong> PDF und DOCX werden automatisch generiert.
                    DOCX-Dateien öffnen sich direkt in Microsoft Word.
                  </div>
                `
  } catch (error) {
    logger.error("Error generating documents:", error)
    showStatus(`Fehler: ${error.message}`, "error")
  }
}
// Print document function
function printDocument() {
  logger.log("printDocument function called")

  // Get current active form tab
  const activeTab = getCurrentActiveTab()
  logger.log("Active form tab:", activeTab)

  if (!activeTab) {
    showStatus("Bitte wählen Sie zuerst eine Registerkarte aus", "error")
    return
  }

  // Get current form values
  const currentValues = getCurrentFormValues()
  logger.log("Current form values:", currentValues)

  // Create a new window for printing
  logger.log("Creating print window...")
  const printWindow = window.open("", "_blank", "width=800,height=600,scrollbars=yes,resizable=yes")

  if (!printWindow) {
    logger.error("Failed to open print window - popup blocked?")
    showStatus("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.", "error")
    return
  }

  logger.log("Print window created:", printWindow)
  printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="${currentLanguage}">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Drucken - ${activeTab.textContent}</title>
                  <style>
                    ${getResumeStyleCSS(currentResumeStyle, currentLayout)}
                    
                    /* Print-specific overrides */
                    body {
                      margin: 0;
                      padding: 20mm;
                      line-height: 1.5;
                    }
                    .document {
                      max-width: 210mm;
                      margin: 0 auto;
                      background: white;
                      padding: 0;
                    }
                    .header {
                      margin-bottom: 20mm;
                    }
                    .sender-section {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      margin-bottom: 8mm;
                      padding-bottom: 3mm;
                    }
                    .sender-info {
                      font-size: 11pt;
                      color: #333;
                      flex: 1;
                    }
                    .date {
                      text-align: right;
                      font-size: 11pt;
                      color: #333;
                      margin-left: 20mm;
                      white-space: nowrap;
                      flex-shrink: 0;
                    }
                    .recipient {
                      font-size: 11pt;
                      line-height: 1.4;
                      margin-bottom: 15mm;
                      margin-top: 8mm;
                    }
                    .content {
                      font-size: 12pt;
                      line-height: 1.6;
                    }
                    .content h2 {
                      font-size: 14pt;
                      font-weight: bold;
                      margin: 15mm 0 5mm 0;
                      color: #333;
                    }
                    .content h3 {
                      font-size: 12pt;
                      font-weight: bold;
                      margin: 10mm 0 3mm 0;
                      color: #333;
                    }
                    .content p {
                      margin: 6mm 0;
                      text-align: justify;
                    }
                    .signature {
                      margin-top: 25mm;
                      font-size: 12pt;
                    }
                    .signature p {
                      margin-bottom: 3mm;
                    }
                    /* Lebenslauf styles - matching preview styles */
                    h1 {
                      color: #1a5490;
                      font-size: 22pt;
                      border-bottom: 2px solid #1a5490;
                      padding-bottom: 4mm;
                      margin-bottom: 8mm;
                      font-weight: bold;
                      text-align: center;
                    }
                    h2 {
                      color: #2c5aa0;
                      font-size: 14pt;
                      margin-top: 6mm;
                      margin-bottom: 3mm;
                      border-bottom: 1px solid #2c5aa0;
                      padding-bottom: 1mm;
                      font-weight: bold;
                      text-transform: uppercase;
                      letter-spacing: 0.5pt;
                    }
                    .header-info {
                      color: #666;
                      font-size: 12pt;
                      margin-bottom: 10mm;
                      text-align: left;
                    }
                    .grid {
                      display: grid;
                      grid-template-columns: 40mm 1fr;
                      gap: 3mm;
                      margin: 3mm 0;
                      font-size: 11pt;
                      line-height: 1.4;
                    }
                    .label {
                      font-weight: bold;
                      color: #333;
                      font-size: 11pt;
                    }
                    .grid > div:not(.label) {
                      text-align: left;
                    }
                    ul {
                      margin: 3mm 0;
                      padding-left: 5mm;
                      font-size: 11pt;
                      line-height: 1.4;
                    }
                    li {
                      margin: 1.5mm 0;
                      color: #000;
                    }
                    .experience-item {
                      margin-bottom: 6mm;
                      padding: 4mm;
                      background: #f9f9f9;
                      border-left: 3px solid #2c5aa0;
                      font-size: 11pt;
                      line-height: 1.4;
                    }
                    .experience-item strong {
                      color: #1a5490;
                      font-size: 12pt;
                    }
                    .experience-item em {
                      color: #666;
                      font-style: italic;
                      font-size: 10pt;
                    }
                    p {
                      text-align: left;
                    }
                    .date-info {
                      margin-top: 15mm;
                      text-align: center;
                      color: #666;
                      font-size: 10pt;
                    }
                    @media print {
                      body { margin: 0; padding: 0; }
                      .document { max-width: none; margin: 0; }
                    }
                  </style>
                </head>
                <body class="resume-style-${currentResumeStyle} layout-${currentLayout}">
                  <div class="document">
                    ${activeTab === "bewerbung" ? generateBewerbungHTML(currentValues) : generateLebenslaufHTML(currentValues)}
                  </div>
                </body>
                </html>
              `)

  printWindow.document.close()

  // Immediately try to focus the window
  logger.log("Attempting to focus print window immediately...")
  try {
    printWindow.focus()
    logger.log("Window focused successfully")
  } catch (e) {
    logger.log("Could not focus window immediately:", e)
  }

  // Wait for content to load, then print
  printWindow.onload = function () {
    logger.log("Print window loaded, attempting to focus...")

    // Multiple attempts to focus the window
    const focusWindow = () => {
      try {
        printWindow.focus()
        logger.log("Window focused in onload")

        // Try to bring window to front
        if (printWindow.focus) {
          printWindow.focus()
        }

        // Try to bring window to front on different browsers
        try {
          printWindow.moveTo(0, 0)
          printWindow.resizeTo(screen.width, screen.height)
          logger.log("Window positioned and resized")
        } catch (e) {
          logger.log("Could not position window:", e)
        }

        // Try to focus using different methods
        try {
          printWindow.blur()
          printWindow.focus()
          logger.log("Window focused with blur/focus method")
        } catch (e) {
          logger.log("Blur/focus method failed:", e)
        }
      } catch (e) {
        logger.log("Focus attempt failed:", e)
      }
    }

    // Try to focus immediately
    focusWindow()

    // Try again after a short delay
    setTimeout(focusWindow, 50)

    // Try again after another delay
    setTimeout(focusWindow, 100)

    // Small delay to ensure window is focused before printing
    setTimeout(() => {
      logger.log("Attempting to print...")
      printWindow.print()

      // Close window after printing (with delay)
      setTimeout(() => {
        logger.log("Closing print window...")
        printWindow.close()
      }, 1000)
    }, 200)
  }

  // Additional focus attempt after window creation
  setTimeout(() => {
    logger.log("Additional focus attempt after 500ms...")
    try {
      printWindow.focus()
      logger.log("Additional focus successful")
    } catch (e) {
      logger.log("Additional focus failed:", e)
    }
  }, 500)

  showStatus("Druckdialog wird geöffnet...", "info")
}

// Generate Bewerbung HTML
function generateBewerbungHTML(data) {
  // Get current form values dynamically
  const currentValues = getCurrentFormValues()

  logger.log("Generating bewerbung HTML with current values:", currentValues)

  const currentDate =
    getTranslation("fieldValues.date") ||
    new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  const jobNumber =
    currentValues.jobNumber && currentValues.jobNumber.length > 0
      ? `<br>${getTranslation("fieldValues.jobNumberLabel") || "Ihre Ausschreibung Nr.:"} ${currentValues.jobNumber}`
      : ""

  // Get translated greeting
  const greeting = currentValues.greeting || getTranslation("form.greetingPlaceholder") || ""

  return `<!doctype html>
      <html lang="de">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Bewerbung - ${data.fullName}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: "Arial", sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #333;
              margin: 0;
            }
            .sender-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8mm;
              padding-bottom: 2mm;
            }
            .sender-info {
              font-size: 11pt;
              color: #333;
              flex: 1;
            }
            .recipient {
              margin-bottom: 10mm;
              margin-top: 8mm;
              font-size: 11pt;
            }
            .date {
              text-align: right;
              margin-left: 20mm;
              white-space: nowrap;
              font-size: 11pt;
              color: #333;
            }
            .subject {
              font-weight: bold;
              margin: 10mm 0;
            }
            .content p {
              margin-bottom: 8mm;
              text-align: justify;
            }
            .signature {
              margin-top: 20mm;
            }
            .attachments {
              margin-top: 15mm;
            }
          </style>
        </head>
        <body>
          <div class="sender-section">
            <div class="sender-info">
              <strong>${currentValues.fullName}</strong><br />
              ${currentValues.address}<br>
              ${currentValues.email}<br>
              Tel: ${currentValues.phone}
            </div>

            <div class="date">Magdeburg, den ${currentDate}</div>
          </div>

          <div class="recipient">
            <strong>${currentValues.company}</strong><br />
            Personalmanagement<br />
            ${currentValues.contactName || ""}<br />
            ${currentValues.contactAddress || ""}<br />
            ${currentValues.contactPhone ? `Tel: ${currentValues.contactPhone}` : ""}<br />
            ${currentValues.contactEmail ? `E-Mail: ${currentValues.contactEmail}` : ""}
          </div>

          <div class="subject" style="color: ${currentValues.subjectColor || "#1a5490"}; font-weight: bold; font-size: 14pt; margin: 15mm 0; text-align: left;">
            ${currentValues.subject || ""}${jobNumber}
          </div>

          <div class="content">
            <p>${greeting}</p>

            <p>${currentValues.motivation}</p>

            <p>${currentValues.qualifications}</p>

            <p>${currentValues.tasks}</p>

            ${currentValues.future ? `<p>${currentValues.future}</p>` : ""}

            <p>${currentValues.availability}</p>
            <p style="white-space: pre-line;">${currentValues.closing}</p>
            <p style="white-space: pre-line;">${currentValues.signature}</p>
          </div>

        </body>
      </html>`
}

// Generate Lebenslauf HTML
function generateLebenslaufHTML(data) {
  // Get current form values dynamically
  const currentValues = getCurrentFormValues()

  logger.log("Generating lebenslauf HTML with current values:", currentValues)

  const birthDate = currentValues.lebenslaufBirthDate || currentValues.birthDate
  const formattedBirthDate = birthDate
    ? new Date(birthDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    : ""

  const currentMonth = (() => {
    const city = currentValues.letterCity || getTranslation("fieldValues.letterCity") || "Magdeburg";
    const dateInput = currentValues.letterDate;

    if (dateInput) {
      const dateObj = new Date(dateInput);
      const currentLang = localStorage.getItem("selectedLanguage") || "de";

      if (currentLang === "de") {
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        const month = monthNames[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${month} ${year}`;
      } else if (currentLang === "en") {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = monthNames[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${month} ${year}`;
      } else {
        const monthNames = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];
        const month = monthNames[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${month} ${year}`;
      }
    }

    return new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long" });
  })()

  // Get lebenslauf specific values
  const fullName = currentValues.lebenslaufFullName || currentValues.fullName || ""
  const address = currentValues.lebenslaufAddress || currentValues.address || ""
  const phone = currentValues.lebenslaufPhone || currentValues.phone || ""
  const email = currentValues.lebenslaufEmail || currentValues.email || ""
  const nationality = currentValues.lebenslaufNationality || currentValues.nationality || ""
  const position = currentValues.position || ""
  const summary = currentValues.lebenslaufSummary || ""
  const skills = currentValues.lebenslaufSkills || ""
  const experience = currentValues.lebenslaufExperience || ""
  const education = currentValues.lebenslaufEducation || ""
  const certifications = currentValues.lebenslaufCertifications || ""
  const languages = currentValues.lebenslaufLanguages || ""
  const additional = currentValues.lebenslaufAdditional || ""

  return `<!doctype html>
      <html lang="de">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Lebenslauf - ${data.fullName}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: "Arial", sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #333;
            }
            h1 {
              color: #1a5490;
              font-size: 24pt;
              border-bottom: 3px solid #1a5490;
              padding-bottom: 5mm;
            }
            h2 {
              color: #2c5aa0;
              font-size: 14pt;
              margin-top: 8mm;
              border-bottom: 1px solid #2c5aa0;
              padding-bottom: 2mm;
            }
            .header-info {
              color: #666;
              font-size: 12pt;
              margin-bottom: 10mm;
            }
            .grid {
              display: grid;
              grid-template-columns: 50mm auto;
              gap: 5mm;
              margin: 5mm 0;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            ul {
              margin: 5mm 0;
              padding-left: 6mm;
            }
            li {
              margin: 2mm 0;
            }
            .experience-item {
              margin-bottom: 8mm;
              padding: 3mm;
              background: #f8f8f8;
              border-left: 3px solid #2c5aa0;
            }

            /* Стилі для фото в заголовку */
            .header-with-photo {
              display: flex;
              gap: 5mm;
              margin-bottom: 10mm;
              align-items: flex-start;
            }

            .photo-container {
              width: 35mm;
              height: 45mm;
              border: 2px solid #1a5490;
              border-radius: 3px;
              overflow: hidden;
              background: #f8f9fa;
              position: relative;
              flex-shrink: 0;
            }

            .photo-container img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .photo-placeholder {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #666;
              font-size: 10pt;
              text-align: center;
              background: #f0f8ff;
            }

            .name-container {
              flex: 1;
            }

            .name-container h1 {
              margin-top: 0;
            }
          </style>
        </head>
        <body>
          <!-- Заголовок з фото -->
          <div class="header-with-photo">
            <div class="photo-container">
              ${(() => {
                // Отримуємо фото з даних або глобальної змінної
                const photoUrl = globalPhotoData || currentValues.lebenslaufPhoto
                logger.log("PDF Generation - Photo URL:", photoUrl)

                if (
                  photoUrl &&
                  typeof photoUrl === "string" &&
                  (photoUrl.startsWith("data:image/") || photoUrl.startsWith("blob:"))
                ) {
                  return `<img src="${photoUrl}" alt="Foto" />`
                } else {
                  return `<div class="photo-placeholder">📷<br>Kein Foto</div>`
                }
              })()}
            </div>
            <div class="name-container">
              <h1 style="text-align: left;">${fullName.toUpperCase()}</h1>
              <div class="header-info" style="text-align: left;">Bewerbung für ${position}</div>
            </div>
          </div>

          <h2>PERSÖNLICHE DATEN</h2>
          <div class="grid">
            <div class="label">Geburtsdatum:</div>
            <div>${formattedBirthDate}</div>
            <div class="label">Adresse:</div>
            <div>${address}</div>
            <div class="label">Telefon:</div>
            <div>${phone}</div>
            <div class="label">E-Mail:</div>
            <div>${email}</div>
            <div class="label">Staatsangehörigkeit:</div>
            <div>${nationality}</div>
            <div class="label">Aufenthaltsstatus:</div>
            <div>Aufenthaltserlaubnis vorhanden</div>
          </div>

          <h2>BERUFLICHE QUALIFIKATION</h2>
          <p>
            ${summary}
          </p>

          <h2>KERNKOMPETENZEN</h2>
          <ul>
            <li>${skills}</li>
          </ul>

          <h2>BERUFSERFAHRUNG</h2>
          <div class="experience-item">
            <div style="white-space: pre-line;">${experience}</div>
          </div>

          <h2>AUSBILDUNG</h2>
          <div class="experience-item">
            <div style="white-space: pre-line;">${education}</div>
          </div>

          <h2>ZERTIFIZIERUNGEN & KURSE</h2>
          <div class="experience-item">
            <div style="white-space: pre-line;">${certifications}</div>
          </div>

          <h2>SPRACHKENNTNISSE</h2>
          <div style="white-space: pre-line;">${languages}</div>

          <h2>ZUSÄTZLICHE QUALIFIKATIONEN</h2>
          <div style="white-space: pre-line;">${additional}</div>

          <div
            style="margin-top: 15mm; text-align: center; color: #666; font-size: 10pt"
          >
            ${(() => {
              const city = currentValues.letterCity || getTranslation("fieldValues.letterCity") || "Magdeburg";
              return `${city}, ${currentMonth}`;
            })()}
          </div>
        </body>
      </html>`
}

// Download file function with directory picker
async function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], {type: mimeType})

  // Try File System Access API first (modern browsers)
  if ("showSaveFilePicker" in window) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: getFileDescription(mimeType),
            accept: {[mimeType]: [getFileExtension(mimeType)]}
          }
        ]
      })

      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      showStatus(`Datei gespeichert: ${filename}`, "success")
      return
    } catch (error) {
      if (error.name !== "AbortError") {
        logger.warn("File System Access API failed, falling back to download:", error)
      } else {
        showStatus("Speichern abgebrochen", "info")
        return
      }
    }
  }

  // Fallback to traditional download
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  showStatus(`Datei heruntergeladen: ${filename}`, "success")
}

// Get file description based on MIME type
function getFileDescription(mimeType) {
  switch (mimeType) {
    case "text/html":
      return "HTML-Dokument"
    case "application/pdf":
      return "PDF-Dokument"
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "Word-Dokument"
    default:
      return "Dokument"
  }
}

// Get file extension based on MIME type
function getFileExtension(mimeType) {
  switch (mimeType) {
    case "text/html":
      return ".html"
    case "application/pdf":
      return ".pdf"
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx"
    default:
      return ""
  }
}

// Check if File System Access API is supported
function isFileSystemAccessSupported() {
  return "showSaveFilePicker" in window
}

// Show browser compatibility info
function showBrowserCompatibility() {
  const isSupported = isFileSystemAccessSupported()
  const message = isSupported
    ? "✅ Ihr Browser unterstützt die Auswahl des Speicherorts für Dateien"
    : "ℹ️ Ihr Browser unterstützt die automatische Speicherort-Auswahl nicht. Dateien werden im Download-Ordner gespeichert."

  showStatus(message, isSupported ? "success" : "info")
}

// Generate PDF using browser print dialog (more reliable)
async function generatePDF(htmlContent, filename) {
  try {
    logger.log("Generating PDF using browser print dialog...")

    // Use the alternative method which is more reliable
    generatePDFAlternative(htmlContent, filename)
  } catch (error) {
    logger.error("Error generating PDF:", error)
    showStatus(`PDF-Generierung fehlgeschlagen: ${error.message}`, "error")
  }
}
// Alternative PDF generation using print dialog
function generatePDFAlternative(htmlContent, filename) {
  try {
    // Check if HTML content is empty
    if (!htmlContent || htmlContent.trim().length === 0) {
      logger.error("HTML content is empty for filename:", filename)
      showStatus(`HTML-Inhalt ist leer für ${filename}`, "error")
      return
    }

    logger.log("Generating PDF alternative for:", filename, "HTML length:", htmlContent.length)

    // Create a new window for printing
    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=600,scrollbars=yes,resizable=yes"
    )

    if (!printWindow) {
      showStatus("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.", "error")
      return
    }

    printWindow.document.write(`
                  <!DOCTYPE html>
                  <html lang="de">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>PDF - ${filename}</title>
                    <style>
                      @page {
                        size: A4;
                        margin: 15mm;
                      }
                      ${getResumeStyleCSS(currentResumeStyle, currentLayout)}
                      
                      /* PDF-specific overrides */
                      body {
                        font-size: 11pt;
                        line-height: 1.5;
                        margin: 0;
                        padding: 0;
                      }
                      .document {
                        max-width: none;
                        margin: 0;
                      }
                      h1 {
                        color: #1a5490;
                        font-size: 22pt;
                        border-bottom: 2px solid #1a5490;
                        padding-bottom: 4mm;
                        margin-bottom: 8mm;
                        font-weight: bold;
                        text-align: center;
                      }
                      h2 {
                        color: #2c5aa0;
                        font-size: 14pt;
                        margin-top: 6mm;
                        margin-bottom: 3mm;
                        border-bottom: 1px solid #2c5aa0;
                        padding-bottom: 1mm;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 0.5pt;
                      }
                      .header-info {
                        color: #666;
                        font-size: 12pt;
                        margin-bottom: 10mm;
                        text-align: left;
                      }
                      .grid {
                        display: grid;
                        grid-template-columns: 40mm 1fr;
                        gap: 3mm;
                        margin: 3mm 0;
                        font-size: 11pt;
                        line-height: 1.4;
                      }
                      .label {
                        font-weight: bold;
                        color: #333;
                        font-size: 11pt;
                      }
                      .grid > div:not(.label) {
                        text-align: left;
                      }
                      ul {
                        margin: 3mm 0;
                        padding-left: 5mm;
                        font-size: 11pt;
                        line-height: 1.4;
                      }
                      li {
                        margin: 1.5mm 0;
                        color: #000;
                      }
                      .experience-item {
                        margin-bottom: 6mm;
                        padding: 4mm;
                        background: #f9f9f9;
                        border-left: 3px solid #2c5aa0;
                        font-size: 11pt;
                        line-height: 1.4;
                      }
                      .experience-item strong {
                        color: #1a5490;
                        font-size: 12pt;
                      }
                      .experience-item em {
                        color: #666;
                        font-style: italic;
                        font-size: 10pt;
                      }
                      p {
                        text-align: left;
                      }
                      .date-info {
                        margin-top: 15mm;
                        text-align: center;
                        color: #666;
                        font-size: 10pt;
                      }
                      .sender-section {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 8mm;
                        padding-bottom: 3mm;
                      }
                      .sender-info {
                        font-size: 11pt;
                        color: #333;
                        flex: 1;
                      }
                      .date {
                        text-align: right;
                        font-size: 11pt;
                        color: #333;
                        margin-left: 20mm;
                        white-space: nowrap;
                        flex-shrink: 0;
                      }
                      .recipient {
                        margin-bottom: 15mm;
                        font-size: 11pt;
                        line-height: 1.4;
                        text-align: left;
                        margin-top: 8mm;
                      }
                      .subject {
                        font-weight: bold;
                        margin: 15mm 0;
                        font-size: 12pt;
                        line-height: 1.4;
                        color: #000;
                      }
                      .content p {
                        margin-bottom: 6mm;
                        text-align: justify;
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #000;
                      }
                      .signature {
                        margin-top: 25mm;
                        font-size: 12pt;
                      }
                      .signature p {
                        margin-bottom: 3mm;
                      }
                      @media print {
                        body { margin: 0; padding: 0; }
                        .document { max-width: none; margin: 0; }
                      }
                    </style>
                  </head>
                  <body class="resume-style-${currentResumeStyle} layout-${currentLayout}">
                    <div class="document">
                      ${htmlContent}
                    </div>
                  </body>
                  </html>
                `)

    printWindow.document.close()

    // Focus and print
    printWindow.onload = function () {
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 100)
    }

    showStatus("PDF-Druckdialog geöffnet. Bitte wählen Sie 'Als PDF speichern'.", "info")
  } catch (error) {
    logger.error("Error generating PDF alternative:", error)
    showStatus("Fehler beim Öffnen des PDF-Druckdialogs", "error")
  }
}

// Convert HTML to DOCX using client-side library
async function htmlToDocx(htmlContent) {
  try {
    // Clean HTML content for better DOCX conversion
    const cleanHtml = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script tags
      .replace(/class="[^"]*"/gi, "") // Remove class attributes
      .replace(/style="[^"]*"/gi, "") // Remove inline styles
      .replace(/data-[^=]*="[^"]*"/gi, "") // Remove data attributes
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    // Use html-docx-js library to convert HTML to DOCX
    const docxBlob = htmlDocx.asBlob(cleanHtml, {
      orientation: "portrait",
      margins: {
        top: 720,
        right: 720,
        bottom: 720,
        left: 720
      }
    })

    return docxBlob
  } catch (error) {
    logger.error("Error converting HTML to DOCX:", error)
    throw new Error("Failed to convert HTML to DOCX format")
  }
}

// Generate DOCX using client-side conversion
async function generateDOCX(htmlContent, filename) {
  try {
    logger.log("Generating DOCX document...")
    showStatus("DOCX wird generiert...", "info")

    // Convert HTML to DOCX using client-side library
    if (typeof htmlDocx === "undefined") {
      throw new Error("html-docx-js library not loaded. Please check your internet connection.")
    }

    const docxBlob = htmlDocx.asBlob(htmlContent)
    logger.log("DOCX generated successfully, size:", docxBlob.size, "bytes")

    // Try File System Access API first (працює тільки з user gesture)
    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Word Document",
              accept: {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
              }
            }
          ],
          excludeAcceptAllOption: true,
          startIn: 'downloads'
        })

        const writable = await fileHandle.createWritable()
        await writable.write(docxBlob)
        await writable.close()

        showStatus(`✅ DOCX gespeichert: ${filename}`, "success")
        return
      } catch (error) {
        if (error.name === "AbortError") {
          showStatus("DOCX-Speichern abgebrochen", "info")
          return
        }
        logger.warn("File System Access API failed, using fallback:", error)
      }
    }

    // Fallback to traditional download
    const url = URL.createObjectURL(docxBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showStatus(`✅ DOCX heruntergeladen: ${filename}`, "success")
  } catch (error) {
    logger.error("Error generating DOCX:", error)

    // Try fallback method
    logger.log("Trying fallback DOCX generation...")
    const fallbackSuccess = window.generateSimpleDOCX(htmlContent, filename)

    if (fallbackSuccess) {
      showStatus(`✅ Документ збережено як RTF: ${filename.replace(".docx", ".rtf")}`, "success")
    } else {
      let errorMessage = "DOCX-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut."
      if (error.message.includes("html-docx-js library not loaded")) {
        errorMessage =
          "Бібліотека для генерації DOCX не завантажена. Перевірте наявність файлу html-docx.js."
      } else if (error.message.includes("html-docx-js")) {
        errorMessage = "Помилка бібліотеки html-docx-js. Спробуйте інший формат документа."
      }

      showStatus(errorMessage, "error")
    }
  }
}

// Alternative DOCX generation using RTF format (Word-compatible)
function generateDOCXAlternative(htmlContent, filename) {
  try {
    // Create a simple text version for Word
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent

    // Extract text content and format it better
    let textContent = tempDiv.textContent || tempDiv.innerText || ""

    // Clean up the text content
    textContent = textContent
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n\n") // Clean up multiple newlines
      .trim()

    // Create a professional RTF content with proper formatting
    const rtfContent = `{\\rtf1\\ansi\\deff0
      {\\fonttbl {\\f0 Times New Roman;}{\\f1 Arial;}}
      {\\colortbl;\\red0\\green0\\blue0;\\red26\\green84\\blue144;\\red44\\green90\\blue160;\\red128\\green128\\green128;}
      {\\stylesheet {\\s0\\snext0 Normal;}{\\s1\\snext1 Heading 1;}{\\s2\\snext2 Heading 2;}}
      \\margl1440\\margr1440\\margt1440\\margb1440
      \\f0\\fs22
      ${textContent.replace(/\n/g, "\\par ").replace(/\r/g, "").replace(/\s+/g, " ").trim()}
      }`

    const blob = new Blob([rtfContent], {
      type: "application/rtf"
    })

    // Try File System Access API first
    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = window.showSaveFilePicker({
          suggestedName: filename.replace(".docx", ".rtf"),
          types: [
            {
              description: "RTF-Dokument",
              accept: {"application/rtf": [".rtf"]}
            }
          ]
        })

        const writable = fileHandle.createWritable()
        writable.write(blob)
        writable.close()

        showStatus(
          `Word-Dokument gespeichert: ${filename.replace(".docx", ".rtf")} (RTF-Format)`,
          "success"
        )
        return
      } catch (error) {
        if (error.name !== "AbortError") {
          logger.warn("File System Access API failed, using fallback:", error)
        } else {
          showStatus("RTF-Speichern abgebrochen", "info")
          return
        }
      }
    }

    // Fallback to traditional download
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename.replace(".docx", ".rtf")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showStatus(
      `Word-Dokument heruntergeladen: ${filename.replace(".docx", ".rtf")} (RTF-Format, öffnet in Word)`,
      "success"
    )
  } catch (error) {
    logger.error("Error generating RTF alternative:", error)
    showStatus("Alternative DOCX-Generierung fehlgeschlagen", "error")
  }
}

// Load external script dynamically

// Convert HTML content to DOCX format
function convertHTMLToDOCX(htmlContent, docx) {
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = htmlContent

  const elements = []

  // Process each element
  function processElement(element) {
    if (element.nodeType === Node.TEXT_NODE) {
      if (element.textContent.trim()) {
        elements.push(
          new docx.TextRun({
            text: element.textContent,
            size: 22 // 11pt in half-points
          })
        )
      }
      return
    }

    const tagName = element.tagName?.toLowerCase()

    switch (tagName) {
      case "h1":
        elements.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: element.textContent,
                bold: true,
                size: 32,
                color: "1a5490"
              })
            ],
            spacing: {after: 200}
          })
        )
        break

      case "h2":
        elements.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: element.textContent,
                bold: true,
                size: 28,
                color: "2c5aa0"
              })
            ],
            spacing: {after: 200}
          })
        )
        break

      case "p":
        const paragraphChildren = []
        Array.from(element.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            if (child.textContent.trim()) {
              paragraphChildren.push(
                new docx.TextRun({
                  text: child.textContent,
                  size: 22
                })
              )
            }
          } else if (child.tagName?.toLowerCase() === "br") {
            paragraphChildren.push(new docx.TextRun({text: "\n"}))
          }
        })

        if (paragraphChildren.length > 0) {
          elements.push(
            new docx.Paragraph({
              children: paragraphChildren,
              spacing: {after: 200}
            })
          )
        }
        break

      case "ul":
        Array.from(element.querySelectorAll("li")).forEach(li => {
          elements.push(
            new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: `• ${li.textContent}`,
                  size: 22
                })
              ],
              spacing: {after: 100}
            })
          )
        })
        break

      case "li":
        elements.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `• ${element.textContent}`,
                size: 22
              })
            ],
            spacing: {after: 100}
          })
        )
        break

      default:
        // Process child elements
        Array.from(element.childNodes).forEach(child => {
          processElement(child)
        })
    }
  }

  processElement(tempDiv)
  return elements
}

// Generate PDF only
async function generatePDFOnly() {
  const form = DOM.bewerbungForm
  const formDataObj = new FormData(form)
  formData = Object.fromEntries(formDataObj)

  // Додаємо фото до formData якщо воно є
  if (globalPhotoData) {
    formData.photo = globalPhotoData
    formData.lebenslaufPhoto = globalPhotoData
  }

  logger.log("Generate PDF - FormData with photo:", {
    hasPhoto: !!formData.photo,
    hasLebenslaufPhoto: !!formData.lebenslaufPhoto,
    globalPhotoData: !!globalPhotoData
  })

  showStatus("PDF-Dokumente werden generiert...", "info")

  try {
    // Get current active tab
    const activeTab = getCurrentActiveTab()
    logger.log("Active tab for PDF generation:", activeTab)

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const name = formData.fullName ? formData.fullName.replace(/\s+/g, "_") : "Dokument"

    // Generate PDF for active tab with File System Access API
    if (activeTab === "bewerbung") {
      const bewerbungHtml = generateBewerbungHTML(formData)
      logger.log("Generated bewerbung HTML length:", bewerbungHtml.length)
      await generatePDFWithSaveDialog(bewerbungHtml, `Bewerbung_${name}_${timestamp}.pdf`)
      showStatus("Bewerbung PDF erfolgreich erstellt!", "success")
    } else if (activeTab === "lebenslauf") {
      const lebenslaufHtml = generateLebenslaufHTML(formData)
      logger.log("Generated lebenslauf HTML length:", lebenslaufHtml.length)
      await generatePDFWithSaveDialog(lebenslaufHtml, `Lebenslauf_${name}_${timestamp}.pdf`)
      showStatus("Lebenslauf PDF erfolgreich erstellt!", "success")
    } else {
      showStatus("Bitte wählen Sie eine Registerkarte aus", "error")
    }
  } catch (error) {
    logger.error("Error generating PDF:", error)
    showStatus(`Fehler beim Generieren der PDF-Dateien: ${error.message}`, "error")
  }
}

async function generatePDFWithSaveDialog(htmlContent, suggestedName) {
  try {
    if ('showSaveFilePicker' in window) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [{
          description: 'PDF Document',
          accept: { 'application/pdf': ['.pdf'] }
        }]
      });

      // Відкриваємо діалог друку для збереження в PDF
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        showStatus("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.", "error");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PDF - ${suggestedName}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            ${getResumeStyleCSS(currentResumeStyle, currentLayout)}
            body {
              font-size: 11pt;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }
            .document {
              max-width: none;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `);

      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      }, 500);

      showStatus(`PDF wird gespeichert unter: ${suggestedName}`, "success");
    } else {
      // Fallback для старих браузерів
      generatePDFAlternative(htmlContent, suggestedName);
    }
  } catch (error) {
    logger.error("File System Access API failed:", error);
    // Fallback якщо користувач закрив діалог
    generatePDFAlternative(htmlContent, suggestedName);
  }
}

// Generate DOCX only
async function generateDOCXOnly() {
  const form = DOM.bewerbungForm
  const formDataObj = new FormData(form)
  formData = Object.fromEntries(formDataObj)

  // Додаємо фото до formData якщо воно є
  if (globalPhotoData) {
    formData.photo = globalPhotoData
    formData.lebenslaufPhoto = globalPhotoData
  }

  logger.log("Generate DOCX - FormData with photo:", {
    hasPhoto: !!formData.photo,
    hasLebenslaufPhoto: !!formData.lebenslaufPhoto,
    globalPhotoData: !!globalPhotoData
  })

  showStatus("DOCX-Dokumente werden generiert...", "info")

  try {
    // Get current active tab
    const activeTab = getCurrentActiveTab()
    logger.log("Active tab for DOCX generation:", activeTab)

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const name = formData.fullName ? formData.fullName.replace(/\s+/g, "_") : "Dokument"

    // Generate DOCX only for active tab
    if (activeTab === "bewerbung") {
      const bewerbungHtml = generateBewerbungHTML(formData)
      logger.log("Generated bewerbung HTML length:", bewerbungHtml.length)
      await generateDOCX(bewerbungHtml, `Bewerbung_${name}_${timestamp}.docx`)
      showStatus("Bewerbung DOCX erfolgreich erstellt!", "success")
    } else if (activeTab === "lebenslauf") {
      const lebenslaufHtml = generateLebenslaufHTML(formData)
      logger.log("Generated lebenslauf HTML length:", lebenslaufHtml.length)
      await generateDOCX(lebenslaufHtml, `Lebenslauf_${name}_${timestamp}.docx`)
      showStatus("Lebenslauf DOCX erfolgreich erstellt!", "success")
    } else {
      showStatus("Bitte wählen Sie eine Registerkarte aus", "error")
    }
  } catch (error) {
    logger.error("Error generating DOCX documents:", error)
    showStatus(`Fehler beim Generieren der DOCX-Dateien: ${error.message}`, "error")
  }
}

// Reset form
function resetForm() {
  DOM.bewerbungForm.reset()
  formData = {}
  DOM.previewContent.innerHTML = `
         <h2 data-translate="preview.title">📋 Live Preview</h2>
                <div class="preview-placeholder">
                  <div class="icon">📄</div>
                  <p>${getTranslation("preview.placeholder") || "Die Vorschau wird automatisch aktualisiert, während Sie die Felder ausfüllen."}</p>
                </div>
              `
  showStatus("Formular wurde zurückgesetzt", "info")
}

// Language and translation functionality - MIGRATED TO TranslationService
// Backwards compatibility variables
let currentLanguage = "de"
let translations = {}
let originalContent = {} // Store original content for each field

// Compatibility wrapper for loadTranslations
async function loadTranslations(lang) {
  return await translationService.loadTranslations(lang);
}

// Change language - DELEGATED TO TranslationService
async function changeLanguage(lang) {
  const newLang = lang || document.getElementById("languageSelect")?.value
  logger.log("changeLanguage called with:", newLang, "current:", currentLanguage)

  if (newLang !== currentLanguage) {
    // Store current active tab before language change
    const currentActiveTab = currentPreviewType
    logger.log("Storing current active tab:", currentActiveTab)

    // Use TranslationService for language change
    const success = await translationService.changeLanguage(newLang);

    if (success) {
      // Update compatibility variable
      currentLanguage = translationService.getCurrentLanguage();
      translations = {}; // Clear old compatibility cache

      logger.log("Language changed to:", currentLanguage)

      // Re-add event listeners after translation
      logger.log("Calling addFormEventListeners()")
      addFormEventListeners()

      // Save current state
      logger.log("Calling saveFormData()")
      saveFormData()

      // Add delay to ensure translations are applied
      logger.log("Waiting for translations to be applied...")
      await new Promise(resolve => setTimeout(resolve, 200))

      // Перекласти введений користувачем текст на нову мову
      logger.log("Translating user inputs to new language:", newLang)
      try {
        await translateAllUserInputs(newLang)
      } catch (error) {
        logger.error("Error translating user inputs:", error)
      }

      // Update preview with current active tab
      logger.log("Updating preview for current tab:", currentActiveTab)
      await showPreview(currentActiveTab)
    } else {
      logger.error("Failed to change language to:", newLang)
    }
  }
}
// Translate form field values - DELEGATED TO TranslationService
async function translateFormFields() {
  return await translationService.translateFormFields();
}

// Translate page - DELEGATED TO TranslationService
function translatePage() {
  return translationService.translatePage();
}

// Initialize theme
async function initializeTheme() {
  // Use localStorage for theme management (no backend needed for GitHub Pages)
  const savedTheme = localStorage.getItem("theme") || "dark"
  document.documentElement.setAttribute("data-theme", savedTheme)
  updateThemeVariables(savedTheme)

  // Update theme toggle icon
  const themeIcons = document.querySelectorAll(".theme-icon")
  themeIcons.forEach(icon => {
    icon.textContent = savedTheme === "dark" ? "☀️" : "🌙"
  })

  // Add click event listener to theme toggle
  const themeToggle = document.getElementById("themeToggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }
}

// Toggle theme
function toggleTheme() {
  try {
    logger.log("Toggling theme...")
    const currentTheme = document.documentElement.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    logger.log("Current theme:", currentTheme)
    logger.log("New theme:", newTheme)

    // Update theme immediately
    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)

    // Update all icons (header + mobile)
    const themeIcons = document.querySelectorAll(".theme-icon")
    themeIcons.forEach(icon => {
      icon.textContent = newTheme === "dark" ? "☀️" : "🌙"
    })

    // Update theme variables
    updateThemeVariables(newTheme)

    // Add transition class for smooth theme change
    document.body.classList.add("theme-transitioning")
    setTimeout(() => {
      document.body.classList.remove("theme-transitioning")
    }, 300)

    // Save current state
    saveFormData()

    // Theme is automatically saved to localStorage (no backend needed for GitHub Pages)
    logger.log("Theme saved to localStorage:", newTheme)
  } catch (error) {
    logger.error("Error toggling theme:", error)
  }
}

// Translate form content
async function translateFormContent() {
  const contentElements = document.querySelectorAll("[data-translate-content]")
  contentElements.forEach(element => {
    const key = element.getAttribute("data-translate-content")
    const translation = getTranslation(key)
    if (translation) {
      // Store original content if not already stored
      if (!originalContent[element.id]) {
        originalContent[element.id] = element.value
      }
      element.value = translation
    }
  })

  // Update greeting field with translation
  const greetingField = document.getElementById("greeting")
  if (greetingField) {
    const translatedGreeting = getTranslation("form.greetingPlaceholder")
    if (translatedGreeting) {
      greetingField.value = translatedGreeting
    }
  }

  // Update preview after translation
  await updatePreviewOnInput()

  // Force update preview with new language
  setTimeout(async () => {
    const activeTab = document.querySelector(".preview-tab.active")
    if (activeTab) {
      if (
        activeTab.textContent.includes("Anschreiben") ||
        activeTab.textContent.includes("Cover Letter") ||
        activeTab.textContent.includes("Лист заявки")
      ) {
        await showPreview("bewerbung")
      } else if (
        activeTab.textContent.includes("Lebenslauf") ||
        activeTab.textContent.includes("Resume") ||
        activeTab.textContent.includes("Резюме")
      ) {
        await showPreview("lebenslauf")
      }
    }
  }, 100)
}

// Restore original content
async function restoreOriginalContent() {
  const contentElements = document.querySelectorAll("[data-translate-content]")
  contentElements.forEach(element => {
    if (originalContent[element.id]) {
      element.value = originalContent[element.id]
    }
  })

  // Update preview after restoring original content
  await updatePreviewOnInput()
}

// Toggle between translated and original content
let showingOriginal = false
async function toggleTranslation() {
  const toggleBtn = document.getElementById("toggleTranslationBtn")

  if (showingOriginal) {
    // Show translated content
    await translateFormContent()
    toggleBtn.textContent = getTranslation("buttons.toggleTranslation") || "🔄 Original anzeigen"
    showingOriginal = false
  } else {
    // Show original content
    await restoreOriginalContent()
    toggleBtn.textContent = "🔄 Übersetzung anzeigen"
    showingOriginal = true
  }
}

// Get translation by key - DELEGATED TO TranslationService
function getTranslation(key) {
  return translationService.getTranslation(key);
}

// Initialize mobile menu
function initializeMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn")
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay")
  const mobileMenuPanel = document.getElementById("mobileMenuPanel")
  const mobileThemeToggle = document.getElementById("mobileThemeToggle")

  if (!mobileMenuBtn || !mobileMenuOverlay || !mobileMenuPanel) {
    logger.warn("Mobile menu elements not found")
    return
  }

  // Toggle mobile menu
  function toggleMobileMenu() {
    const isOpen = mobileMenuPanel.classList.contains("active")

    if (isOpen) {
      closeMobileMenu()
    } else {
      openMobileMenu()
    }
  }

  function openMobileMenu() {
    mobileMenuOverlay.style.display = "block"
    mobileMenuPanel.classList.add("active")
    mobileMenuBtn.classList.add("active")
    mobileMenuBtn.innerHTML = "✕"
    document.body.style.overflow = "hidden"

    // Після першого відкриття ховаємо підказку
    mobileMenuBtn.classList.remove("hint")
    localStorage.setItem("mobileMenuHintShown", "1")

    // Add animation
    setTimeout(() => {
      mobileMenuOverlay.classList.add("active")
    }, 10)
  }

  function closeMobileMenu() {
    mobileMenuOverlay.classList.remove("active")
    mobileMenuPanel.classList.remove("active")
    mobileMenuBtn.classList.remove("active")
    mobileMenuBtn.innerHTML = "☰"
    document.body.style.overflow = ""

    setTimeout(() => {
      mobileMenuOverlay.style.display = "none"
    }, 300)
  }

  // Event listeners
  mobileMenuBtn.addEventListener("click", toggleMobileMenu)
  mobileMenuOverlay.addEventListener("click", closeMobileMenu)

  // Показати підказку один раз на малих екранах
  if (window.innerWidth <= 640 && !localStorage.getItem("mobileMenuHintShown")) {
    mobileMenuBtn.classList.add("hint")
    // Авто-згасання підказки через 6 секунд, якщо не відкрили меню
    setTimeout(() => mobileMenuBtn.classList.remove("hint"), 6000)
  }

  // Close menu when clicking on mobile theme toggle
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener("click", () => {
      toggleTheme()
      closeMobileMenu()
    })
  }

  // Close menu when clicking on language flags in mobile menu
  const mobileLanguageFlags = mobileMenuPanel.querySelectorAll(".language-flag")
  mobileLanguageFlags.forEach(flag => {
    flag.addEventListener("click", () => {
      closeMobileMenu()
    })
  })

  // Close menu when clicking on form tab buttons in mobile menu
  const mobileFormTabs = mobileMenuPanel.querySelectorAll(".form-tab-button")
  mobileFormTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      closeMobileMenu()
    })
  })

  // Close menu when clicking on action buttons in mobile menu
  const mobileActionButtons = mobileMenuPanel.querySelectorAll(".btn-success, .btn-secondary")
  mobileActionButtons.forEach(btn => {
    if (btn.onclick) {
      const originalOnclick = btn.onclick
      btn.onclick = function () {
        originalOnclick.call(this)
        closeMobileMenu()
      }
    }
  })

  // Close menu on escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && mobileMenuPanel.classList.contains("active")) {
      closeMobileMenu()
    }
  })

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 480 && mobileMenuPanel.classList.contains("active")) {
      closeMobileMenu()
    }
  })
}

// ===== АВТОМАТИЧНИЙ ПЕРЕКЛАД ТЕКСТУ =====

// Кеш для перекладів щоб уникнути повторних запитів
const translationCache = new Map()

// Функція для автоматичного перекладу тексту
async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text || text.trim() === "") return text

  // Створюємо ключ для кешу
  const cacheKey = `${sourceLang}-${targetLang}-${text}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)
  }

  // Спочатку спробуємо локальний словник
  const localTranslation = await translateTextFallback(text, targetLang, sourceLang)
  if (localTranslation !== text) {
    logger.log(`✅ Local translation found: "${text}" -> "${localTranslation}"`)
    translationCache.set(cacheKey, localTranslation)
    return localTranslation
  }

  // Try Google Translate API directly
  try {
    logger.log(`🌐 Using Google Translate API for: "${text}"`)

    // Use Google Translate API directly (no server needed)
    const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

    const response = await fetch(googleTranslateUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translatedText = data[0][0][0]
        if (translatedText && translatedText !== text) {
          logger.log(`✅ Google Translate successful: "${text}" -> "${translatedText}"`)
          translationCache.set(cacheKey, translatedText)
          return translatedText
        }
      }
    } else {
      logger.log(`⚠️ Google Translate API error: ${response.status}`)
    }
  } catch (error) {
    logger.log(`⚠️ Google Translate request failed: ${error.message}`)
  }

  // Якщо всі методи не спрацювали, повертаємо оригінальний текст
  logger.log(`ℹ️ No translation available for: "${text}"`)
  return text
}

// Резервна функція перекладу через LibreTranslate (якщо доступний)
async function translateTextFallback(text, targetLang, sourceLang = "auto") {
  try {
    logger.log("Trying fallback translation method")

    // Розширений словник для основних фраз
    const basicDictionary = {
      de: {
        Name: "Name",
        Address: "Adresse",
        Phone: "Telefon",
        Email: "E-Mail",
        Experience: "Berufserfahrung",
        Education: "Ausbildung",
        Skills: "Fähigkeiten",
        "Mykola Vutov": "Mykola Vutov",
        Ukrainisch: "Ukrainisch",
        Deutsch: "Deutsch",
        Englisch: "Englisch",
        Russisch: "Russisch",
        Muttersprache: "Muttersprache",
        Verheiratet: "Verheiratet",
        Ledig: "Ledig",
        Geschieden: "Geschieden",
        Vollzeit: "Vollzeit",
        Teilzeit: "Teilzeit",
        Schichtarbeit: "Schichtarbeit",
        Führerschein: "Führerschein",
        "Klasse B": "Klasse B",
        "Gesundheitlich fit": "Gesundheitlich fit",
        Belastbar: "Belastbar",
        Flexibilität: "Flexibilität",
        Arbeitszeiten: "Arbeitszeiten",
        "Sofortige Verfügbarkeit": "Sofortige Verfügbarkeit",
        "Universitätsklinikum Magdeburg": "Universitätsklinikum Magdeburg",
        "Herr Frank Güllmeister": "Herr Frank Güllmeister",
        "Bewerbung als": "Bewerbung als",
        "Sehr geehrter": "Sehr geehrter",
        "mit großem Interesse": "mit großem Interesse",
        Stellenanzeige: "Stellenanzeige",
        gelesen: "gelesen",
        Möglichkeit: "Möglichkeit",
        "renommierten Krankenhaus": "renommierten Krankenhaus",
        arbeiten: "arbeiten",
        "Menschen helfen": "Menschen helfen",
        motiviert: "motiviert",
        bewerben: "bewerben",
        zuverlässige: "zuverlässige",
        verantwortungsbewusste: "verantwortungsbewusste",
        Person: "Person",
        "erforderlichen Eigenschaften": "erforderlichen Eigenschaften",
        Position: "",
        Hygiene: "Hygiene",
        Sauberkeit: "Sauberkeit",
        "höchste Priorität": "höchste Priorität",
        grundlegend: "grundlegend",
        Gesundheitswesen: "Gesundheitswesen",
        betrachte: "betrachte",
        "bisherigen Arbeit": "bisherigen Arbeit",
        "gut im Team": "gut im Team",
        gearbeitet: "gearbeitet",
        organisieren: "organisieren",
        kommunikativ: "kommunikativ",
        freundlich: "freundlich",
        "stressigen Situationen": "stressigen Situationen",
        ruhig: "ruhig",
        effizient: "effizient",
        bleiben: "bleiben"
      },
      en: {
        Name: "Name",
        Adresse: "Address",
        Telefon: "Phone",
        "E-Mail": "Email",
        Berufserfahrung: "Experience",
        Ausbildung: "Education",
        Fähigkeiten: "Skills",
        "Mykola Vutov": "Mykola Vutov",
        Ukrainisch: "Ukrainian",
        Deutsch: "German",
        Englisch: "English",
        Russisch: "Russian",
        Muttersprache: "Native language",
        Verheiratet: "Married",
        Ledig: "Single",
        Geschieden: "Divorced",
        Vollzeit: "Full-time",
        Teilzeit: "Part-time",
        Schichtarbeit: "Shift work",
        Führerschein: "Driver's license",
        "Klasse B": "Class B",
        "Gesundheitlich fit": "Physically fit",
        Belastbar: "Resilient",
        Flexibilität: "Flexibility",
        Arbeitszeiten: "Working hours",
        "Sofortige Verfügbarkeit": "Immediate availability"
      },
      uk: {
        Name: "Ім'я",
        Address: "Адреса",
        Phone: "Телефон",
        Email: "Пошта",
        Experience: "Досвід",
        Education: "Освіта",
        Skills: "Навички",
        "Mykola Vutov": "Микола Вутов",
        Ukrainisch: "Українська",
        Deutsch: "Німецька",
        Englisch: "Англійська",
        Russisch: "Російська",
        Muttersprache: "Рідна мова",
        Verheiratet: "Одружений",
        Ledig: "Неодружений",
        Geschieden: "Розлучений",
        Vollzeit: "Повний робочий день",
        Teilzeit: "Неповний робочий день",
        Schichtarbeit: "Робота в зміни",
        Führerschein: "Водійські права",
        "Klasse B": "Клас B",
        "Gesundheitlich fit": "Фізично здоровий",
        Belastbar: "Стримкий",
        Flexibilität: "Гнучкість",
        Arbeitszeiten: "Робочі години",
        "Sofortige Verfügbarkeit": "Негайна доступність"
      }
    }

    if (basicDictionary[targetLang] && basicDictionary[targetLang][text]) {
      return basicDictionary[targetLang][text]
    }

    return text // Повернути оригінальний текст якщо переклад недоступний
  } catch (error) {
    logger.error("Fallback translation failed:", error)
    return text
  }
}
// Функція для перекладу всіх текстових полів форми
async function translateAllUserInputs(targetLang) {
  try {
    logger.log(`Translating all user inputs to: ${targetLang}`)

    // Знаходимо всі текстові поля та textarea, які користувач може заповнити
    const inputFields = document.querySelectorAll('input[type="text"], textarea')
    const fieldsToTranslate = []

    // Фільтруємо поля які потрібно перекласти
    inputFields.forEach(field => {
      if (field.readOnly || field.disabled) return
      if (!field.value || field.value.trim().length < 2) return
      // Пропускаємо поля з емейлами, телефонами тощо
      if (field.value.includes("@") || field.value.match(/^\+?[\d\s\-\(\)]+$/)) return
      // Пропускаємо поля з датами
      if (field.value.match(/^\d{4}-\d{2}-\d{2}$/) || field.value.match(/^\d{2}\.\d{2}\.\d{4}$/))
        return
      // Пропускаємо поля з номерами
      if (field.value.match(/^\d+$/) && field.value.length < 10) return
      // Пропускаємо поля з адресами (містять цифри та коротші)
      if (field.value.match(/^\d+.*\d+/) && field.value.length < 20) return
      fieldsToTranslate.push(field)
    })

    if (fieldsToTranslate.length === 0) {
      logger.log("No fields to translate")
      return
    }

    logger.log(`Found ${fieldsToTranslate.length} fields to translate`)

    // Перекладаємо поля з обмеженою паралельністю
    const batchSize = 3 // Максимум 3 поля одночасно
    for (let i = 0; i < fieldsToTranslate.length; i += batchSize) {
      const batch = fieldsToTranslate.slice(i, i + batchSize)

      // Перекласти batch паралельно з обробкою помилок
      await Promise.all(
        batch.map(async field => {
          try {
            logger.log(`🔍 About to translate field: ${field.name || field.id || "unknown"}`)
            await translateInputField(field, targetLang)
            logger.log(`✅ Successfully translated field: ${field.name || field.id || "unknown"}`)
          } catch (error) {
            logger.log(`⚠️ Error translating field: ${error.message}`)
            logger.log(`⚠️ Error stack: ${error.stack}`)
          }
        })
      )

      // Невелика затримка між батчами
      if (i + batchSize < fieldsToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    logger.log("All user inputs translated")

    // Показати повідомлення користувачу
    const statusMessage = document.createElement("div")
    statusMessage.className = "status-message status-success"
    statusMessage.textContent = `Переклад завершено: ${fieldsToTranslate.length} полів`
    statusMessage.style.position = "fixed"
    statusMessage.style.top = "20px"
    statusMessage.style.right = "20px"
    statusMessage.style.zIndex = "10000"
    document.body.appendChild(statusMessage)

    setTimeout(() => {
      statusMessage.remove()
    }, 3000)
  } catch (error) {
    logger.log(`⚠️ Error translating user inputs: ${error.message}`)

    // Показати повідомлення про помилку
    const errorMessage = document.createElement("div")
    errorMessage.className = "status-message status-error"
    errorMessage.textContent = "Помилка при перекладі полів"
    errorMessage.style.position = "fixed"
    errorMessage.style.top = "20px"
    errorMessage.style.right = "20px"
    errorMessage.style.zIndex = "10000"
    errorMessage.style.backgroundColor = "#f8d7da"
    errorMessage.style.color = "#721c24"
    errorMessage.style.padding = "10px"
    errorMessage.style.borderRadius = "5px"
    document.body.appendChild(errorMessage)

    setTimeout(() => {
      errorMessage.remove()
    }, 3000)
  }
}

// ===== СИСТЕМА СТИЛІВ РЕЗЮМЕ =====

let currentResumeStyle = "modern-professional"
let currentLayout = "single-column"

// Функція для зміни стилю резюме
function applyResumeStyle(style, layout) {
  logger.log(`Applying resume style: ${style}, layout: ${layout}`)

  // Отримати контейнер превью
  const previewSection = document.querySelector(".preview-section")
  if (!previewSection) return

  // Видалити всі попередні класи стилів
  const styleClasses = [
    "resume-style-modern-professional",
    "resume-style-minimalist",
    "resume-style-creative-blue",
    "resume-style-elegant-serif",
    "resume-style-tech-modern",
    "resume-style-classic-formal",
    "resume-style-artistic-gradient",
    "resume-style-corporate-clean",
    "resume-style-startup-bold",
    "resume-style-academic-traditional"
  ]

  const layoutClasses = ["layout-single-column", "layout-two-column"]

  // Видалити старі класи
  previewSection.classList.remove(...styleClasses, ...layoutClasses)

  // Додати новий стиль і layout
  previewSection.classList.add(`resume-style-${style}`)
  previewSection.classList.add(`layout-${layout}`)

  // Зберегти поточний стиль
  currentResumeStyle = style
  currentLayout = layout

  // Оновити превью
  updatePreviewOnInput()
}

// Функція для оновлення генерації HTML з новим стилем
function generateStyledLebenslaufHTML(data) {
  // Базова HTML структура
  let htmlContent = generateLebenslaufHTML(data)

  // Додати класи стилю до HTML
  const styleClasses = `resume-style-${currentResumeStyle} layout-${currentLayout}`

  // Замінити body class
  htmlContent = htmlContent.replace("<body>", `<body class="${styleClasses}">`)

  // Додати стилі CSS в head
  const additionalCSS = `
          <style>
            /* Вставити CSS стилі для вибраного стилю */
            ${getResumeStyleCSS(currentResumeStyle, currentLayout)}
          </style>
        `

  // Вставити додаткові стилі перед закриттям head
  htmlContent = htmlContent.replace("</head>", additionalCSS + "</head>")

  return htmlContent
}

// Функція для отримання CSS стилів
function getResumeStyleCSS(style, layout) {
  // Тут повернемо CSS для конкретного стилю
  // (Це спрощена версія, в реальності краще зберігати CSS у окремих файлах)
  return `
          .${style} { /* CSS стилі для ${style} */ }
          .${layout} { /* CSS стилі для ${layout} */ }
        `
}

// Initialize on page load
const DOM = {};

function initializeModules() {
  domCache = new DOMCache();
  eventManager = new EventManager();
  // stateManager вже ініціалізований як singleton в state-management.js
  // validationService, exportService, performanceMonitor вже ініціалізовані в своїх модулях
  accessibilityManager = new AccessibilityManager();

  // Ініціалізація TranslationService
  translationService.setLogger(logger);
  translationService.setDOMCache(domCache);

  // Ініціалізація PreviewService
  previewService.setLogger(logger);
  previewService.setTranslationService(translationService);
  previewService.setDOMCache(domCache);

  formHandler = new FormHandler({
    stateManager: stateManager,
    validationService: validationService
  });

  initializeDOMCache();

  logger.log('✅ Модулі ініціалізовано успішно');
}

function initializeDOMCache() {
  DOM.bewerbungForm = domCache.get('bewerbungForm');
  DOM.photoPreview = domCache.get('photoPreview');
  DOM.lebenslaufSection = domCache.get('lebenslaufSection');
  DOM.removePhoto = domCache.get('removePhoto');
  DOM.lebenslaufPhoto = domCache.get('lebenslaufPhoto');
  DOM.previewContent = domCache.get('previewContent');
  DOM.statusMessage = domCache.get('statusMessage');
  DOM.themeToggle = domCache.get('themeToggle');
  DOM.mobileThemeToggle = domCache.get('mobileThemeToggle');
  DOM.mobileMenuPanel = domCache.get('mobileMenuPanel');
  DOM.position = domCache.get('position');
  DOM.subject = domCache.get('subject');
  DOM.resumeStyle = domCache.get('resumeStyle');
}

document.addEventListener("DOMContentLoaded", async function () {
  logger.log("=== DOMContentLoaded event triggered ===")
  logger.log("Current timestamp:", new Date().toISOString())
  logger.log("Document ready state:", document.readyState)

  initializeModules();

  // Initialize TranslationService with default language
  logger.log("🌍 Initializing TranslationService with German language");
  try {
    const success = await translationService.changeLanguage("de");
    logger.log("🌍 Language change result:", success);
    currentLanguage = translationService.getCurrentLanguage();
    logger.log("🌍 Current language after init:", currentLanguage);

    // Перевіряємо чи завантажені переклади
    const hasTranslations = translationService.hasTranslations("de");
    logger.log("🌍 Has German translations:", hasTranslations);

    if (!hasTranslations) {
      logger.error("❌ German translations not loaded, trying manual load");
      const manualLoad = await translationService.loadTranslations("de");
      logger.log("🔧 Manual load result:", manualLoad);
    }
  } catch (error) {
    logger.error("❌ TranslationService initialization failed:", error);
  }

  // Update active language flag
  const initLanguageFlags = document.querySelectorAll(".language-flag")
  initLanguageFlags.forEach(flag => {
    flag.classList.remove("active")
    if (flag.getAttribute("data-lang") === "de") {
      flag.classList.add("active")
    }
  })

  // Translate page elements after loading translations
  translatePage()

  // Translate form fields after loading translations
  await translateFormFields()

  // Initialize theme
  await initializeTheme()

  // Initialize mobile menu
  initializeMobileMenu()

  // Initialize proportional page scale variable
  updatePageScaleVar()

  // Try to load saved data first
  const dataLoaded = loadFormData()

  // Видаляємо небажаний текст "Station Service Angestellter"
  removeUnwantedPositionText()

  // Initialize form tabs
  logger.log("Initializing form tabs with currentPreviewType:", currentPreviewType)
  switchFormTab(currentPreviewType)

  // Load data for Lebenslauf if it's the initial tab
  // Data loading is now handled by the save/load buttons in the form

  // Ensure the correct tab is active
  setTimeout(() => {
    const activeTab = document.querySelector(".form-tab-button.active")
    logger.log("Active tab after initialization:", activeTab ? activeTab.textContent : "none")
  }, 100)

  // Add click handlers for form tabs
  const formTabButtons = document.querySelectorAll(".form-tab-button")
  formTabButtons.forEach(button => {
    button.addEventListener("click", function () {
      const tabName = this.getAttribute("onclick").match(/switchFormTab\('(\w+)'\)/)[1]
      switchFormTab(tabName)
    })
  })

  // Initialize form and add event listeners
  initializeForm()

  // Load photo from JSON if available
  loadPhotoFromJSON()

  // Initialize photo upload functionality
  logger.log("=== About to initialize photo upload functions ===")
  logger.log("Current timestamp:", new Date().toISOString())

  // Check if elements exist before initializing
  const lebenslaufPhotoInput = DOM.lebenslaufPhoto
  const lebenslaufPhotoPreview = DOM.photoPreview

  logger.log("Lebenslauf photo input exists:", !!lebenslaufPhotoInput)
  logger.log("Lebenslauf photo preview exists:", !!lebenslaufPhotoPreview)

  initializePhotoUpload()

  // Add click handlers for language flags
  const clickLanguageFlags = document.querySelectorAll(".language-flag")
  clickLanguageFlags.forEach(flag => {
    flag.addEventListener("click", function () {
      const lang = this.getAttribute("data-lang")

      // Update active flag
      clickLanguageFlags.forEach(f => f.classList.remove("active"))
      this.classList.add("active")

      // Change language
      changeLanguage(lang)
    })
  })

  // Add click handler for translate button
  const translateButton = document.getElementById("translateButton")
  if (translateButton) {
    translateButton.addEventListener("click", async function () {
      logger.log("Manual translation button clicked")

      // Показати індикацію завантаження
      const originalIcon = this.innerHTML
      const buttonElement = this
      buttonElement.innerHTML = '<span class="translate-icon">⏳</span>'
      buttonElement.disabled = true

      try {
        // Отримати поточну мову інтерфейсу
        const currentLang = currentLanguage || "de"
        logger.log(`🌐 Starting Google Translate for language: ${currentLang}`)

        // Показати прогрес
        buttonElement.innerHTML = '<span class="translate-icon">🌐</span>'

        await translateAllUserInputs(currentLang)

        // Показати успішне завершення
        buttonElement.innerHTML = '<span class="translate-icon">✅</span>'
        showStatus(`✅ Переклад завершено через Google Translate!`, "success")
        setTimeout(() => {
          buttonElement.innerHTML = originalIcon || '<span class="translate-icon">🌐</span>'
        }, 2000)
      } catch (error) {
        logger.log(`⚠️ Google Translate failed: ${error.message}`)
        // Показати помилку
        buttonElement.innerHTML = '<span class="translate-icon">❌</span>'
        showStatus(`❌ Помилка перекладу: ${error.message}`, "error")
        setTimeout(() => {
          buttonElement.innerHTML = originalIcon || '<span class="translate-icon">🌐</span>'
        }, 2000)
      } finally {
        buttonElement.disabled = false
      }
    })
  }

  // Add event handlers for resume style selector
  const styleDropdown = document.getElementById("resumeStyle")
  const layoutRadios = document.querySelectorAll('input[name="layout"]')

  if (styleDropdown) {
    styleDropdown.addEventListener("change", function () {
      const selectedStyle = this.value
      const selectedLayout =
        document.querySelector('input[name="layout"]:checked')?.value || "single-column"
      applyResumeStyle(selectedStyle, selectedLayout)
      logger.log(`Style changed to: ${selectedStyle}`)
    })
  }

  layoutRadios.forEach(radio => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        const selectedLayout = this.value
        const selectedStyle = styleDropdown?.value || "modern-professional"
        applyResumeStyle(selectedStyle, selectedLayout)
        logger.log(`Layout changed to: ${selectedLayout}`)
      }
    })
  })

  // Initialize with default style
  applyResumeStyle(currentResumeStyle, currentLayout)

  // Show initial preview
  updatePreviewOnInput()
  // Ensure scale is correct after initial render
  setTimeout(updatePageScaleVar, 50)

  // Initialize form with default values and event listeners
  initializeForm()

  // Event listeners are now handled by addFormEventListeners()
  // No need for duplicate listeners here

  // Auto-generate preview on page load with saved or default values
  setTimeout(async () => {
    await showPreview(currentPreviewType)
  }, 500)
})

// Debug functions for testing (available in browser console)
window.debugGetTranslation = getTranslation
window.debugShowStatus = showStatus
window.debugPopulateForm = populateFormWithLebenslaufData

// Debug function for photo upload testing
window.debugPhotoUpload = function () {
  logger.log("=== PHOTO UPLOAD DEBUG ===")
  logger.log("globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")
  logger.log("Photo input element:", DOM.lebenslaufPhoto)
  logger.log("Photo preview element:", DOM.photoPreview)

  if (globalPhotoData) {
    logger.log("globalPhotoData type:", typeof globalPhotoData)
    logger.log("globalPhotoData length:", globalPhotoData.length)
    logger.log(
      "globalPhotoData starts with data:image/:",
      globalPhotoData.startsWith("data:image/")
    )
  }

  if (formData.lebenslaufPhoto) {
    logger.log("formData.lebenslaufPhoto type:", typeof formData.lebenslaufPhoto)
    logger.log("formData.lebenslaufPhoto length:", formData.lebenslaufPhoto.length)
    logger.log(
      "formData.lebenslaufPhoto starts with data:image/:",
      formData.lebenslaufPhoto.startsWith("data:image/")
    )
  }
}

// Debug function for testing save
window.debugSaveData = async function () {
  logger.log("=== SAVE DATA DEBUG ===")
  logger.log("Current language:", currentLanguage)
  logger.log("About to call saveLebenslaufData()...")
  await saveLebenslaufData()
}

// Debug function for testing photo input
window.debugPhotoInput = function () {
  logger.log("=== PHOTO INPUT DEBUG ===")
  const photoInput = DOM.lebenslaufPhoto
  logger.log("Photo input element:", photoInput)
  logger.log("Photo input value:", photoInput?.value)
  logger.log("Photo input files:", photoInput?.files)
  logger.log("Photo input files length:", photoInput?.files?.length)

  if (photoInput?.files?.length > 0) {
    const file = photoInput.files[0]
    logger.log("Selected file:", file)
    logger.log("File name:", file.name)
    logger.log("File type:", file.type)
    logger.log("File size:", file.size)

    // Test FileReader
    const reader = new FileReader()
    reader.onload = function (e) {
      logger.log("FileReader result:", e.target.result)
      logger.log("Result type:", typeof e.target.result)
      logger.log("Result length:", e.target.result.length)
      logger.log("Starts with data:image/:", e.target.result.startsWith("data:image/"))
    }
    reader.readAsDataURL(file)
  }
}

// Debug function to clear invalid photo data
window.debugClearPhotoData = function () {
  logger.log("=== CLEARING PHOTO DATA ===")
  globalPhotoData = null
  formData.lebenslaufPhoto = null
  logger.log("✅ Photo data cleared")
  logger.log("globalPhotoData:", globalPhotoData)
  logger.log("formData.lebenslaufPhoto:", formData.lebenslaufPhoto)
}

// Function to load photo from JSON file
async function loadPhotoFromJSON() {
  try {
    logger.log("=== LOADING PHOTO FROM JSON ===")
    logger.log(`Current language: ${currentLanguage}`)
    logger.log("Skipping API call - using dynamic preview instead")

    // Skip API call since we're using dynamic preview
    return
  } catch (error) {
    logger.log("Error in loadPhotoFromJSON:", error)
  }
}

// Debug function to test pagination on both tabs
window.debugTestPagination = function () {
  logger.log("🔍 DIAGNOSING PAGINATION ISSUE")
  logger.log("================================")

  const activeTab = getCurrentActiveTab()
  logger.log(`📋 Current active tab: ${activeTab}`)

  // Test bewerbung tab
  logger.log("🅱️ Testing Bewerbung pagination...")
  switchFormTab("bewerbung").then(() => {
    setTimeout(() => {
      const bewerbungActiveTab = getCurrentActiveTab()
      const bewerbungValues = getCurrentFormValues()
      const bewerbungPreview = DOM.previewContent
      const bewerbungPages = bewerbungPreview?.querySelectorAll(".document-page")

      logger.log(`📋 Bewerbung active tab: ${bewerbungActiveTab}`)
      logger.log(`📝 Bewerbung content length: ${JSON.stringify(bewerbungValues).length}`)
      logger.log(`📄 Bewerbung pages found: ${bewerbungPages?.length || 0}`)

      if (bewerbungPages) {
        bewerbungPages.forEach((page, index) => {
          const pageText = page.textContent || page.innerText || ""
          logger.log(`📄   Page ${index + 1}: ${pageText.length} characters`)
        })
      }

      // Test lebenslauf tab
      logger.log("\n📝 Testing Lebenslauf pagination...")
      switchFormTab("lebenslauf").then(() => {
        setTimeout(() => {
          const lebenslaufActiveTab = getCurrentActiveTab()
          const lebenslaufValues = getCurrentFormValues()
          const lebenslaufPreview = DOM.previewContent
          const lebenslaufPages = lebenslaufPreview?.querySelectorAll(".document-page")

          logger.log(`📋 Lebenslauf active tab: ${lebenslaufActiveTab}`)
          logger.log(`📝 Lebenslauf content length: ${JSON.stringify(lebenslaufValues).length}`)
          logger.log(`📄 Lebenslauf pages found: ${lebenslaufPages?.length || 0}`)

          if (lebenslaufPages) {
            lebenslaufPages.forEach((page, index) => {
              const pageText = page.textContent || page.innerText || ""
              logger.log(`📄   Page ${index + 1}: ${pageText.length} characters`)
            })
          }

          logger.log("🏁 Pagination diagnosis complete!")
        }, 500)
      })
    }, 500)
  })
}

// Debug function to test tab switching and form values
window.debugTabSwitching = function () {
  logger.log("=== 🔄 TESTING TAB SWITCHING ===")

  logger.log("1. Current active tab:", getCurrentActiveTab())
  logger.log("2. Current form values:", getCurrentFormValues())

  logger.log("3. Testing bewerbung tab...")
  switchFormTab("bewerbung").then(() => {
    logger.log("4. After switching to bewerbung:")
    logger.log("   Active tab:", getCurrentActiveTab())
    logger.log("   Form values:", getCurrentFormValues())

    setTimeout(() => {
      logger.log("5. Testing lebenslauf tab...")
      switchFormTab("lebenslauf").then(() => {
        logger.log("6. After switching to lebenslauf:")
        logger.log("   Active tab:", getCurrentActiveTab())
        logger.log("   Form values:", getCurrentFormValues())
      })
    }, 1000)
  })
}

// Debug function to refresh photo display
window.debugRefreshPhotoDisplay = function () {
  logger.log("=== REFRESHING PHOTO DISPLAY ===")

  // Check current photo data
  logger.log("globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  // Get photo data from JSON if available
  const photoData = globalPhotoData || formData.lebenslaufPhoto

  if (photoData && photoData.startsWith("data:image/")) {
    logger.log("📸 Valid photo data found, updating display...")

    // Update left menu photo preview
    const photoPreview = DOM.photoPreview
    if (photoPreview) {
      photoPreview.innerHTML = `<img src="${photoData}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`
      logger.log("✅ Left menu photo updated")
    }

    // Update remove button
    const removePhotoBtn = DOM.removePhoto
    if (removePhotoBtn) {
      removePhotoBtn.style.display = "block"
    }

    // Update preview
    updatePreviewOnInput()
    logger.log("✅ Preview updated")
  } else {
    logger.log("❌ No valid photo data found")
  }
}

// Debug function to force photo upload from input
window.debugForcePhotoUpload = function () {
  logger.log("=== FORCING PHOTO UPLOAD ===")
  const photoInput = DOM.lebenslaufPhoto
  if (photoInput && photoInput.files && photoInput.files.length > 0) {
    const file = photoInput.files[0]
    logger.log("📸 Found file:", file.name, file.type, file.size)

    const reader = new FileReader()
    reader.onload = function (e) {
      const dataURL = e.target.result
      logger.log("📸 Photo converted to data URL:", dataURL.length, "characters")
      globalPhotoData = dataURL
      formData.lebenslaufPhoto = dataURL
      logger.log("✅ Photo data updated globally")
    }
    reader.readAsDataURL(file)
  } else {
    logger.log("❌ No file found in input")
  }
}

// Debug function for manual photo upload
window.debugManualPhotoUpload = function () {
  logger.log("=== MANUAL PHOTO UPLOAD DEBUG ===")
  const photoInput = DOM.lebenslaufPhoto
  if (!photoInput) {
    logger.log("❌ Photo input not found")
    return
  }

  // Trigger file input
  photoInput.click()

  // Add event listener for file selection
  photoInput.addEventListener("change", function (e) {
    const file = e.target.files[0]
    if (file) {
      logger.log("File selected:", file.name)

      const reader = new FileReader()
      reader.onload = function (e) {
        const result = e.target.result
        logger.log("Photo data URL created:", result.length, "characters")

        // Update global variables
        globalPhotoData = result
        formData.lebenslaufPhoto = result

        logger.log("✅ Photo uploaded successfully!")
        logger.log("globalPhotoData updated:", !!globalPhotoData)
        logger.log("formData.lebenslaufPhoto updated:", !!formData.lebenslaufPhoto)

        // Update preview
        const photoPreview = DOM.photoPreview
        if (photoPreview) {
          photoPreview.innerHTML = `<img src="${result}" alt="Uploaded photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`
        }
      }
      reader.readAsDataURL(file)
    }
  })
}

// Debug function to manually load photo from JSON
window.debugLoadPhotoFromJSON = function () {
  logger.log("=== MANUALLY LOADING PHOTO FROM JSON ===")
  loadPhotoFromJSON()
}

// Debug function to test synchronization
window.debugTestSync = function () {
  logger.log("=== 🔧 TESTING SYNCHRONIZATION ===")

  // Test Lebenslauf section
  const lebenslaufInputs = document.querySelectorAll(
    "#lebenslaufSection input, #lebenslaufSection textarea, #lebenslaufSection select"
  )
  logger.log(`📝 Found ${lebenslaufInputs.length} inputs in Lebenslauf section`)

  // Test Anschreiben section (it's part of bewerbungForm)
  const anschreibenInputs = document.querySelectorAll(
    "#bewerbungForm input, #bewerbungForm textarea, #bewerbungForm select"
  )
  logger.log(`📝 Found ${anschreibenInputs.length} inputs in Bewerbung/Anschreiben form`)

  // Test main form (same as anschreibenInputs)
  const mainFormInputs = document.querySelectorAll(
    "#bewerbungForm input, #bewerbungForm textarea, #bewerbungForm select"
  )
  logger.log(`📝 Found ${mainFormInputs.length} inputs in main form (same as Anschreiben)`)

  // Check event listeners
  logger.log("🎯 Checking event listeners...")
  let listenersCount = 0

  document
    .querySelectorAll(
      "#bewerbungForm input, #bewerbungForm textarea, #bewerbungForm select, #lebenslaufSection input, #lebenslaufSection textarea, #lebenslaufSection select"
    )
    .forEach(input => {
      // Test if input has event listeners by checking for addEventListener
      // This is a simplified check - we can't easily count actual event listeners
      listenersCount++
    })

  logger.log(`Inputs with event listeners: ${listenersCount}`)

  // Trigger update
  logger.log("Triggering preview update...")
  updatePreviewOnInput()

  return {
    lebenslauf: lebenslaufInputs.length,
    anschreiben: anschreibenInputs.length,
    mainForm: mainFormInputs.length,
    total: lebenslaufInputs.length + anschreibenInputs.length + mainFormInputs.length,
    listenersCount: listenersCount
  }
}

// Compute proportional A4 page scale so content stays positioned and only scales
function updatePageScaleVar() {
  try {
    const container = document.querySelector(".preview-container")
    if (!container) return
    const firstPage = container.querySelector(".document-page")
    if (!firstPage) return

    // Measure natural size without transform to avoid compounded scales
    const prevTransform = firstPage.style.transform
    firstPage.style.transform = "none"
    const naturalWidthPx = firstPage.offsetWidth
    const naturalHeightPx = firstPage.offsetHeight
    firstPage.style.transform = prevTransform

    // Available width accounts for potential inner padding
    // clientWidth already includes padding; use it directly to avoid double subtraction
    const availableWidth = container.clientWidth
    // Try to fit vertically inside visible area of container section
    const containerRect = container.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const availableHeight = Math.max(0, viewportHeight - Math.max(140, containerRect.top))

    const scaleByWidth = availableWidth / naturalWidthPx
    const scaleByHeight = availableHeight > 0 ? availableHeight / naturalHeightPx : scaleByWidth
    // Додаємо невеликий відсоток запасу, щоб уникнути обрізання і поекранних округлень iOS
    const rawScale = Math.min(scaleByWidth, scaleByHeight)
    const scale = Math.max(0.22, Math.min(1, rawScale * 0.96))

    document.documentElement.style.setProperty("--page-scale", String(scale))
  } catch (e) {
    logger.warn("updatePageScaleVar failed:", e)
  }
}

window.addEventListener("resize", () => {
  updatePageScaleVar()
})

// Recalculate scale when the preview container size changes (sidebars/devtools/panels)
const __previewObserver = new ResizeObserver(() => {
  updatePageScaleVar()
})
window.addEventListener("load", () => {
  const c = document.querySelector(".preview-container")
  if (c) __previewObserver.observe(c)
})

// Observe preview DOM changes (pagination re-render) to re-calc scale
const __previewMutObserver = new MutationObserver(() => {
  // microtask to allow layout to settle
  requestAnimationFrame(updatePageScaleVar)
})
window.addEventListener("load", () => {
  const c = document.querySelector(".preview-container")
  if (c) {
    __previewMutObserver.observe(c, {childList: true, subtree: true})

    // ===== РОЗШИРЕНА СИНХРОНІЗАЦІЯ ТА АННОТАЦІЯ ЕКРАНУ =====
    /* 
    1) updateScreenLabel - відображає поточний viewport, container width та масштаб
    2) attachFormSync - підключає події input/focus до полів форми для синхронізації прев'ю
    3) applyInputToPreview - намагається знайти елемент у прев'ю для певного name/id та оновити його
  */

    function getBreakpointName(width) {
      if (width <= 375) return "xx-small (≤375px)"
      if (width <= 414) return "small-phone (≤414px)"
      if (width <= 480) return "small (≤480px)"
      if (width <= 640) return "mobile (≤640px)"
      if (width <= 768) return "tablet-portrait (≤768px)"
      if (width <= 992) return "tablet-landscape (≤992px)"
      if (width <= 1199) return "laptop (≤1199px)"
      if (width <= 1399) return "desktop (≤1399px)"
      return "large-desktop (≥1400px)"
    }

    function updateScreenLabel(availableWidth, scale) {
      try {
        const container = document.querySelector(".preview-container")
        if (!container) return
        let label = container.querySelector(".screen-label")
        if (!label) {
          label = document.createElement("div")
          label.className = "screen-label"
          // Додаємо під preview-container, але перед сторінками для кращої видимості
          container.insertAdjacentElement("afterend", label)
        }
        const vw = Math.round(window.innerWidth || document.documentElement.clientWidth)
        const cW = Math.round(availableWidth || container.clientWidth)
        const bp = getBreakpointName(vw)
        label.innerHTML = `Viewport: <strong>${vw}px</strong> · Preview container: <strong>${cW}px</strong> · Scale: <strong>${Math.round(Number(scale) * 100)}%</strong> · <em>[${bp}]</em>`
      } catch (e) {
        logger.warn("updateScreenLabel failed", e)
      }
    }

    // Легка debounce-обгортка
    function debounce(fn, ms) {
      let t
      return (...a) => {
        clearTimeout(t)
        t = setTimeout(() => fn(...a), ms)
      }
    }

    function applyInputToPreview(input) {
      try {
        if (!input || !input.name) return
        const name = input.name
        // Шукаємо відповідні елементи у документ-preview за data-field-name, id або класом
        const previewRoot = document.querySelector(".document-preview")
        if (!previewRoot) return
        const selectors = [
          `[data-field-name="${name}"]`,
          `#${CSS.escape(name)}`,
          `.${CSS.escape(name.replace(/\s+/g, "-"))}`
        ]
        let target = null
        for (const s of selectors) {
          target = previewRoot.querySelector(s)
          if (target) break
        }
        if (!target) return
        // Оновлення текстового вмісту (в ідеалі структури прев'ю мають відповідати name полів)
        if (input.type === "checkbox" || input.type === "radio") {
          target.textContent = input.checked ? input.value || "✓" : ""
        } else {
          target.textContent = input.value
        }
        // Після оновлення запустити перерахунок масштабу і пагінацію
        requestAnimationFrame(() => {
          updatePageScaleVar()
        })
      } catch (e) {
        logger.warn("applyInputToPreview error", e)
      }
    }

    function attachFormSync() {
      try {
        const inputs = document.querySelectorAll("input[name], textarea[name], select[name]")
        if (!inputs || !inputs.length) return
        const debouncedApply = debounce(el => applyInputToPreview(el), 120)
        inputs.forEach(inp => {
          inp.addEventListener("input", () => debouncedApply(inp), {passive: true})
          // при зміні (change) теж
          inp.addEventListener(
            "change",
            () => {
              applyInputToPreview(inp)
            },
            {passive: true}
          )
          inp.addEventListener("focus", () => {
            // при фокусі спробувати скролити прев'ю до відповідного елемента
            const previewRoot = document.querySelector(".document-preview")
            if (!previewRoot) return
            const target = previewRoot.querySelector(
              `[data-field-name="${inp.name}"], #${CSS.escape(inp.name)}`
            )
            if (target && typeof target.scrollIntoView === "function") {
              try {
                target.scrollIntoView({behavior: "smooth", block: "center"})
              } catch (e) {
                target.scrollIntoView()
              }
            }
          })
        })
      } catch (e) {
        logger.warn("attachFormSync failed", e)
      }
    }

    // Запускаємо attachFormSync після load
    window.addEventListener("load", function () {
      try {
        attachFormSync()
      } catch (e) {
        logger.warn(e)
      }
    })
  }
})
// Debug function to analyze photo data overwriting issue
window.debugPhotoOverwrite = function () {
  logger.log("=== 🔍 ANALYZING PHOTO DATA OVERWRITING ===")

  logger.log("📊 Current state:")
  logger.log("- globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("- formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")
  logger.log("- formData.photo:", formData.photo ? "Present" : "Missing")

  if (globalPhotoData) {
    logger.log("- globalPhotoData type:", typeof globalPhotoData)
    logger.log("- globalPhotoData length:", globalPhotoData.length)
    logger.log(
      "- globalPhotoData starts with data:image/:",
      globalPhotoData.startsWith("data:image/")
    )
  }

  if (formData.lebenslaufPhoto) {
    logger.log("- formData.lebenslaufPhoto type:", typeof formData.lebenslaufPhoto)
    logger.log("- formData.lebenslaufPhoto length:", formData.lebenslaufPhoto.length)
    logger.log(
      "- formData.lebenslaufPhoto starts with data:image/:",
      formData.lebenslaufPhoto.startsWith("data:image/")
    )
  }

  // Check if photo preview is showing
  const photoPreview = DOM.photoPreview
  if (photoPreview) {
    logger.log("- Photo preview element:", photoPreview.innerHTML.substring(0, 100) + "...")
  }

  // Check if remove button is visible
  const removeBtn = DOM.removePhoto
  if (removeBtn) {
    logger.log("- Remove photo button display:", removeBtn.style.display)
  }

  logger.log("🔄 Testing data loading sequence...")
  logger.log("1. Current form data before any operations:")
  logger.log("   - fullName:", formData.fullName)
  logger.log("   - address:", formData.address)
  logger.log("   - photo present:", formData.lebenslaufPhoto ? "Yes" : "No")

  return {
    globalPhotoData: globalPhotoData ? "Present" : "Missing",
    formDataPhoto: formData.lebenslaufPhoto ? "Present" : "Missing",
    photoPreview: photoPreview ? "Element exists" : "Missing",
    removeButton: removeBtn ? "Element exists" : "Missing"
  }
}

// Debug function to test data loading sequence
window.debugDataSequence = async function () {
  logger.log("=== 🔄 TESTING DATA LOADING SEQUENCE ===")

  logger.log("1. Current state before loading:")
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")
  logger.log("   - formData.fullName:", formData.fullName)

  logger.log("2. Testing loadPhotoFromJSON()...")
  await loadPhotoFromJSON()

  logger.log("3. State after loadPhotoFromJSON():")
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  logger.log("4. Testing populateFormWithLebenslaufData()...")
  // Create test data
  const testData = {
    fullName: "Test User",
    address: "Test Address",
    phone: "+49 123 456789",
    email: "test@example.com",
    birthDate: "01.01.1990",
    nationality: "Deutsch",
    photo: globalPhotoData // Use existing photo
  }

  await populateFormWithLebenslaufData(testData)

  logger.log("5. State after populateFormWithLebenslaufData():")
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")
  logger.log("   - formData.fullName:", formData.fullName)

  logger.log("6. Testing updateFormData()...")
  updateFormData()

  logger.log("7. Final state after updateFormData():")
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")
  logger.log("   - formData.fullName:", formData.fullName)

  return {
    initialPhoto: globalPhotoData ? "Present" : "Missing",
    finalPhoto: formData.lebenslaufPhoto ? "Present" : "Missing",
    photoPreserved: globalPhotoData === formData.lebenslaufPhoto
  }
}

// Debug function to test auto-synchronization
window.debugAutoSync = function () {
  logger.log("=== 🔄 TESTING AUTO-SYNCHRONIZATION ===")

  logger.log("1. Checking event listeners...")
  const sections = [
    DOM.bewerbungForm,
    DOM.lebenslaufSection
  ]

  let totalInputs = 0
  let inputsWithListeners = 0

  sections.forEach(section => {
    if (section) {
      const inputs = section.querySelectorAll("input, textarea, select")
      totalInputs += inputs.length
      logger.log(`📝 ${section.id}: ${inputs.length} inputs`)

      inputs.forEach(input => {
        // Check if input has event listeners by testing a simple property
        if (input.addEventListener) {
          inputsWithListeners++
        }
      })
    }
  })

  logger.log(`📊 Total inputs: ${totalInputs}`)
  logger.log(`📊 Inputs with listeners: ${inputsWithListeners}`)

  logger.log("2. Testing form data update...")
  const testValue = "Test " + new Date().getTime()

  // Find a text input to test
  const testInput = document.querySelector(
    "#bewerbungForm input[type='text'], #lebenslaufSection input[type='text']"
  )
  if (testInput) {
    logger.log(`🧪 Testing with input: ${testInput.name || testInput.id}`)
    logger.log(`🧪 Current value: "${testInput.value}"`)

    // Set test value
    testInput.value = testValue
    logger.log(`🧪 Set value to: "${testValue}"`)

    // Trigger input event
    const inputEvent = new Event("input", {bubbles: true})
    testInput.dispatchEvent(inputEvent)
    logger.log(`🧪 Dispatched input event`)

    // Check if formData was updated
    setTimeout(() => {
      logger.log(`🧪 FormData after update:`, formData[testInput.name] || formData[testInput.id])
      logger.log(`🧪 Expected: "${testValue}"`)
      logger.log(`🧪 Match: ${(formData[testInput.name] || formData[testInput.id]) === testValue}`)
    }, 100)
  } else {
    logger.log("❌ No text input found for testing")
  }

  logger.log("3. Testing debounced function...")
  logger.log(`🧪 debouncedUpdatePreview type: ${typeof debouncedUpdatePreview}`)
  logger.log(`🧪 updatePreviewOnInput type: ${typeof updatePreviewOnInput}`)

  return {
    totalInputs: totalInputs,
    inputsWithListeners: inputsWithListeners,
    testValue: testValue,
    testInput: testInput ? testInput.name || testInput.id : "None"
  }
}

// Debug function to test JSON data overwriting
window.debugJSONOverwrite = async function () {
  logger.log("=== 📄 TESTING JSON DATA OVERWRITING ===")

  logger.log("1. Current state before JSON loading:")
  logger.log("   - formData.fullName:", formData.fullName)
  logger.log("   - formData.address:", formData.address)
  logger.log("   - formData.phone:", formData.phone)
  logger.log("   - formData.email:", formData.email)
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  // Test with sample data
  const testData = {
    fullName: "Test User JSON",
    address: "Test Address JSON",
    phone: "+49 123 456789",
    email: "test@json.com",
    birthDate: "01.01.1990",
    nationality: "Deutsch"
    // No photo in test data to test preservation
  }

  logger.log("2. Testing populateFormWithLebenslaufData with test data...")
  await populateFormWithLebenslaufData(testData)

  logger.log("3. State after populateFormWithLebenslaufData:")
  logger.log("   - formData.fullName:", formData.fullName)
  logger.log("   - formData.address:", formData.address)
  logger.log("   - formData.phone:", formData.phone)
  logger.log("   - formData.email:", formData.email)
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  logger.log("4. Testing updateFormData...")
  updateFormData()

  logger.log("5. Final state after updateFormData:")
  logger.log("   - formData.fullName:", formData.fullName)
  logger.log("   - formData.address:", formData.address)
  logger.log("   - formData.phone:", formData.phone)
  logger.log("   - formData.email:", formData.email)
  logger.log("   - globalPhotoData:", globalPhotoData ? "Present" : "Missing")
  logger.log("   - formData.lebenslaufPhoto:", formData.lebenslaufPhoto ? "Present" : "Missing")

  // Check if photo was preserved
  const photoPreserved =
    globalPhotoData && formData.lebenslaufPhoto && globalPhotoData === formData.lebenslaufPhoto

  return {
    initialPhoto: globalPhotoData ? "Present" : "Missing",
    finalPhoto: formData.lebenslaufPhoto ? "Present" : "Missing",
    photoPreserved: photoPreserved,
    dataUpdated: formData.fullName === "Test User JSON"
  }
}

// Debug function to test complete data flow
window.debugDataFlow = async function () {
  logger.log("=== 🔄 TESTING COMPLETE DATA FLOW ===")

  logger.log("1. Initial state:")
  logger.log("   - formData.fullName:", formData.fullName)
  logger.log("   - formData.address:", formData.address)

  // Test user input
  logger.log("2. Testing user input...")
  const nameInput = document.querySelector("#bewerbungForm input[name='fullName']")
  if (nameInput) {
    const testValue = "User Input Test " + new Date().getTime()
    nameInput.value = testValue
    logger.log(`   - Set name input to: "${testValue}"`)

    // Trigger input event
    const inputEvent = new Event("input", {bubbles: true})
    nameInput.dispatchEvent(inputEvent)

    // Wait for debounced update
    setTimeout(() => {
      logger.log("   - formData.fullName after input:", formData.fullName)
      logger.log("   - Match:", formData.fullName === testValue)
    }, 500)
  }

  // Test JSON loading
  logger.log("3. Testing JSON data loading...")
  setTimeout(async () => {
    logger.log("   - Before JSON load - formData.fullName:", formData.fullName)

    // Load JSON data
    await loadDataFromJSON()

    logger.log("   - After JSON load - formData.fullName:", formData.fullName)

    // Test input again after JSON load
    logger.log("4. Testing input after JSON load...")
    const nameInput2 = document.querySelector("#bewerbungForm input[name='fullName']")
    if (nameInput2) {
      const testValue2 = "After JSON Test " + new Date().getTime()
      nameInput2.value = testValue2
      logger.log(`   - Set name input to: "${testValue2}"`)

      // Trigger input event
      const inputEvent2 = new Event("input", {bubbles: true})
      nameInput2.dispatchEvent(inputEvent2)

      // Wait for debounced update
      setTimeout(() => {
        logger.log("   - formData.fullName after second input:", formData.fullName)
        logger.log("   - Match:", formData.fullName === testValue2)
      }, 500)
    }
  }, 1000)

  return {
    initialName: formData.fullName,
    testCompleted: true
  }
}

// Debug function to test if event listeners are working
window.debugEventListeners = function () {
  logger.log("=== 🎯 TESTING EVENT LISTENERS ===")

  // Find a text input
  const nameInput = document.querySelector("#bewerbungForm input[name='fullName']")
  if (!nameInput) {
    logger.log("❌ No name input found")
    return {error: "No name input found"}
  }

  logger.log("📝 Found name input:", nameInput)
  logger.log("📝 Current value:", nameInput.value)

  // Test direct value change
  const testValue = "Event Test " + new Date().getTime()
  logger.log(`🧪 Setting value to: "${testValue}"`)
  nameInput.value = testValue

  // Test if updateFormData works
  logger.log("🧪 Testing updateFormData()...")
  updateFormData()
  logger.log("🧪 formData.fullName after updateFormData:", formData.fullName)

  // Test if debounced function works
  logger.log("🧪 Testing debouncedUpdatePreview()...")
  debouncedUpdatePreview()

  // Test manual event dispatch
  logger.log("🧪 Testing manual event dispatch...")
  const inputEvent = new Event("input", {bubbles: true})
  nameInput.dispatchEvent(inputEvent)

  // Test change event
  const changeEvent = new Event("change", {bubbles: true})
  nameInput.dispatchEvent(changeEvent)

  // Test keyup event
  const keyupEvent = new Event("keyup", {bubbles: true})
  nameInput.dispatchEvent(keyupEvent)

  // Wait and check results
  setTimeout(() => {
    logger.log("🧪 Final formData.fullName:", formData.fullName)
    logger.log("🧪 Expected:", testValue)
    logger.log("🧪 Match:", formData.fullName === testValue)

    // Check if preview was updated
    const previewName = document.querySelector(".preview-content h1")
    if (previewName) {
      logger.log("🧪 Preview name:", previewName.textContent)
    }
  }, 1000)

  return {
    inputFound: true,
    testValue: testValue,
    currentFormData: formData.fullName
  }
}

logger.log("Debug functions available:")
logger.log("- debugGetTranslation('key') - Test translation")
logger.log("- debugShowStatus('message', 'type') - Test status display")
logger.log("- debugPopulateForm(data) - Test form population")
logger.log("- debugPhotoUpload() - Test photo upload status")
logger.log("- debugPhotoInput() - Test photo input element")
logger.log("- debugManualPhotoUpload() - Manual photo upload test")
logger.log("- debugPhotoOverwrite() - Analyze photo data overwriting")
logger.log("- debugDataSequence() - Test data loading sequence")
logger.log("- debugTestSync() - Test synchronization")
logger.log("- debugAutoSync() - Test auto-synchronization")
logger.log("- debugJSONOverwrite() - Test JSON data overwriting")
logger.log("- debugTestPagination() - Test pagination on both tabs")
logger.log("- debugDataFlow() - Test complete data flow")
logger.log("- debugEventListeners() - Test if event listeners work")
logger.log("- debugSaveData() - Test save data with photo")
logger.log("- debugClearPhotoData() - Clear invalid photo data")
logger.log("- debugForcePhotoUpload() - Force photo upload from input")
logger.log("- debugRefreshPhotoDisplay() - Refresh photo display in UI")
logger.log("- debugLoadPhotoFromJSON() - Manually load photo from JSON")
