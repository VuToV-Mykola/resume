/**
 * Configuration file for Bewerbung Document Generator
 * Contains default values and constants to avoid hardcoding
 */

const CONFIG = {
  // Application metadata
  APP: {
    NAME: "Bewerbung Document Generator",
    VERSION: "1.0.0",
    AUTHOR: "Mykola Vutov",
    DESCRIPTION: "Erstellen Sie professionelle Bewerbungsunterlagen",
  },

  // Default user data (can be overridden by form input)
  DEFAULTS: {
    USER: {
      FULL_NAME: "Mykola Vutov",
      ADDRESS: "Am Unterhorstweg 1B, 39122 Magdeburg",
      EMAIL: "vutov_nikola@icloud.com",
      PHONE: "+49 151 64317833",
      BIRTH_DATE: "1985-12-19",
      NATIONALITY: "Ukrainisch",
    },

    // Job application defaults
    POSITION: {
      NAME: "Mitarbeiter im Stationsservice",
      COMPANY: "Universitätsklinikum Magdeburg A.ö.R.",
      CONTACT_NAME: "Herr Frank Güllmeister",
      JOB_NUMBER: "",
      CONTACT_ADDRESS: "",
      CONTACT_PHONE: "",
      CONTACT_EMAIL: "",
    },

    // Letter content defaults
    LETTER: {
      SUBJECT: "Bewerbung als Mitarbeiter im Stationsservice",
      SUBJECT_COLOR: "#1a5490",
      GREETING: "Sehr geehrter Herr Frank Güllmeister,",
      MOTIVATION:
        "mit großem Interesse habe ich Ihre Stellenanzeige für einen Mitarbeiter im Stationsservice gelesen. Die Möglichkeit, in einem renommierten Krankenhaus wie dem Universitätsklinikum Magdeburg zu arbeiten und dabei Menschen zu helfen, motiviert mich sehr, mich bei Ihnen zu bewerben.",
      QUALIFICATIONS:
        "Als zuverlässige und verantwortungsbewusste Person bringe ich die erforderlichen Eigenschaften für diese Position mit. Hygiene und Sauberkeit haben für mich höchste Priorität, was ich als grundlegend für die Arbeit im Gesundheitswesen betrachte. In meiner bisherigen Arbeit habe ich immer gut im Team gearbeitet. Ich kann gut organisieren und bin kommunikativ, freundlich zu allen Menschen und auch in stressigen Situationen ruhig und effizient bleiben.",
      TASKS:
        "Die in Ihrer Ausschreibung genannten Aufgaben - von der Speiseversorgung über Hol- und Bringdienste bis zur hygienischen Aufbereitung - entsprechen genau meinen Fähigkeiten. Ich verstehe die Wichtigkeit dieser Tätigkeiten für das Wohlbefinden der Patienten und bin bereit, mit großer Sorgfalt und Empathie zu arbeiten.",
      FUTURE:
        "Besonders ansprechend finde ich Ihr Angebot der Fort- und Weiterbildungsmöglichkeiten sowie die Aussicht auf einen sicheren Arbeitsplatz. Ich bin motiviert, mich kontinuierlich weiterzuentwickeln und langfristig Teil Ihres Teams zu werden.",
      AVAILABILITY:
        "Ich stehe Ihnen ab sofort zur Verfügung und bin flexibel bezüglich der Arbeitszeiten. Über die Möglichkeit, mich in einem persönlichen Gespräch vorstellen zu dürfen, würde ich mich sehr freuen.",
      CLOSING:
        "Vielen Dank im Voraus für Ihre Antwort!\n\Mit freundlichen Grüßen\nMykola Vutov",
      SIGNATURE:
        "Anlagen:\n- Lebenslauf\n- Zeugnisse",
    },

    // Content translations
    CONTENT: {
      motivation:
        "mit großem Interesse habe ich Ihre Stellenanzeige für einen Mitarbeiter im Stationsservice gelesen. Die Möglichkeit, in einem renommierten Krankenhaus wie dem Universitätsklinikum Magdeburg zu arbeiten und dabei Menschen zu helfen, motiviert mich sehr, mich bei Ihnen zu bewerben.",
      qualifications:
        "Als zuverlässige und verantwortungsbewusste Person bringe ich die erforderlichen Eigenschaften für diese Position mit. Hygiene und Sauberkeit haben für mich höchste Priorität, was ich als grundlegend für die Arbeit im Gesundheitswesen betrachte. In meiner bisherigen Arbeit habe ich immer gut im Team gearbeitet. Ich kann gut organisieren und bin kommunikativ, freundlich zu allen Menschen und auch in stressigen Situationen ruhig und effizient bleiben.",
      tasks:
        "Die in Ihrer Ausschreibung genannten Aufgaben - von der Speiseversorgung über Hol- und Bringdienste bis zur hygienischen Aufbereitung - entsprechen genau meinen Fähigkeiten. Ich verstehe die Wichtigkeit dieser Tätigkeiten für das Wohlbefinden der Patienten und bin bereit, mit großer Sorgfalt und Empathie zu arbeiten.",
      future:
        "Besonders ansprechend finde ich Ihr Angebot der Fort- und Weiterbildungsmöglichkeiten sowie die Aussicht auf einen sicheren Arbeitsplatz. Ich bin motiviert, mich kontinuierlich weiterzuentwickeln und langfristig Teil Ihres Teams zu werden.",
      availability:
        "Ich stehe Ihnen ab sofort zur Verfügung und bin flexibel bezüglich der Arbeitszeiten. Über die Möglichkeit, mich in einem persönlichen Gespräch vorstellen zu dürfen, würde ich mich sehr freuen.",
    },

    // Document settings
    DOCUMENT: {
      PAGE_SIZE: "A4",
      MARGIN: "20mm",
      FONT_FAMILY: "Arial, sans-serif",
      FONT_SIZE: "11pt",
      LINE_HEIGHT: "1.4",
    },
  },

  // Supported languages
  LANGUAGES: {
    DE: "de",
    EN: "en",
    UK: "uk",
  },

  // File upload settings
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
    MAX_DIMENSIONS: {
      WIDTH: 2000,
      HEIGHT: 2000,
    },
  },

  // API endpoints
  API: {
    DOCX_SERVER: "http://localhost:3001",
    THEME_SERVER: "http://localhost:3002",
    LEBENSLAUF_SERVER: "http://localhost:3003",
  },

  // Error messages
  ERRORS: {
    PHOTO_UPLOAD_FAILED: "Photo upload failed",
    INVALID_FILE_TYPE: "Invalid file type",
    FILE_TOO_LARGE: "File too large",
    NETWORK_ERROR: "Network error occurred",
    VALIDATION_ERROR: "Validation error",
  },

  // Validation rules
  VALIDATION: {
    REQUIRED_FIELDS: [
      "fullName",
      "address",
      "email",
      "phone",
      "motivation",
      "qualifications",
      "tasks",
      "future",
      "availability",
    ],
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[0-9\s\-\(\)]{10,}$/,
  },
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
} else if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
}
