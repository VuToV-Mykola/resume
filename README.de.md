### 🌐 Sprache wählen/Choose language/Виберіть мову:
[🇺🇦 Українська](README.md) | [🇬🇧 English](README.en.md) | [🇩🇪 Deutsch](README.de.md)

<!-- AUTOGEN:STATS -->
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML) [![Terminal](https://img.shields.io/badge/mac%20terminal-000000?style=for-the-badge&logo=apple&logoColor=white&labelColor=000000)](https://support.apple.com/guide/terminal/welcome/mac) [![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/) [![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/) 

[![📊 Views](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/VuToV-Mykola/resume/main/assets/db/visitors-badge.json)](https://github.com/VuToV-Mykola/resume/graphs/traffic)
[![⭐ Stars](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/VuToV-Mykola/resume/main/assets/db/likes-badge.json)](https://github.com/VuToV-Mykola/resume/actions/workflows/screenshot-and-visitor.yaml)
[![📦 Size](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/VuToV-Mykola/resume/main/assets/db/repo-size.json)](https://github.com/VuToV-Mykola/resume)
[![📄 License](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/VuToV-Mykola/resume/main/assets/db/repo-license.json)](https://github.com/VuToV-Mykola/resume/blob/main/LICENSE)
[![⬇️ Downloads](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/VuToV-Mykola/resume/main/assets/db/downloads-badge.json)](https://github.com/VuToV-Mykola/resume/releases)

## 📸 Projekt-Screenshot
![Project Screenshot](./assets/screenshot.png)
<!-- END:AUTOGEN -->

## 💖 Autor unterstützen

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?hosted_button_id=D5U6TQ3Q9CVLS)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-PayPal-orange.svg)](https://www.paypal.com/donate/?hosted_button_id=D5U6TQ3Q9CVLS)

> Wenn dieser Generator Ihnen bei der Jobsuche geholfen hat, unterstützen Sie den Autor mit Kaffee! ☕

# 📄 Bewerbung Dokument Generator

Professioneller Bewerbungsdokument-Generator, optimiert für moderne Recruiting-Systeme 2025. Speziell konfiguriert für die Arbeit am Universitätsklinikum Magdeburg.

## 🌟 Features

- **📱 Mobile-First Design**: Vollständig responsiv und für mobile Geräte optimiert
- **🌐 Mehrsprachige Unterstützung**: Deutsch, Englisch und Ukrainisch
- **🎨 Dunkles/Helles Design**: Automatisches Design-Wechsel mit localStorage-Persistenz
- **📝 Professionelle Vorlagen**: Optimiert für ATS (Applicant Tracking Systems)
- **💾 Mehrere Formate**: HTML, PDF, DOCX-Generierung
- **🔄 Echtzeit-Vorschau**: Live-Vorschau der Dokumente während der Eingabe
- **📋 Formularvalidierung**: Umfassende Formularvalidierung und Fehlerbehandlung
- **🎯 Gesundheitswesen-Fokus**: Speziell für Gesundheitspositionen zugeschnitten
- **🤖 Google Translate**: Automatische Übersetzung von Formularfeldern
- **💾 Lokale Speicherung**: Automatisches Speichern von Daten im Browser

## 🚀 Live-Demo

**[Jetzt auf GitHub Pages ausprobieren](https://vutov.github.io/bewerbung-stationsservice/)**

## 🛠️ Lokales Setup

Um dieses Projekt lokal auszuführen:

```bash
# Repository klonen
git clone https://github.com/vutov/bewerbung-stationsservice.git
cd bewerbung-stationsservice

# Abhängigkeiten installieren
npm install

# Das Setup-Skript kopiert automatisch die erforderlichen Bibliotheken
# Sie können es auch manuell ausführen:
npm run setup-libs

# Lokalen Server starten
npm start
# oder
python -m http.server 8000
```

Das Projekt ist unter `http://localhost:8000` verfügbar

## 📱 Mobile Features

- **Responsives Design**: Passt sich perfekt an alle Bildschirmgrößen an
- **Mobile Menü**: Intuitives Hamburger-Menü für einfache Navigation
- **Touch-Friendly**: Optimiert für Touch-Interaktionen
- **iOS-Zoom-Verhinderung**: Verhindert ungewolltes Zoomen bei Formulareingaben
- **Sanftes Scrollen**: Verbessertes Scrollen auf mobilen Geräten

## 🛠️ Verwendete Technologien

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, CSS Custom Properties
- **Icons**: Unicode-Emojis für plattformübergreifende Kompatibilität
- **Schriftarten**: Inter-Schriftfamilie für moderne Typografie
- **Bereitstellung**: GitHub Pages (statisches Hosting)
- **Übersetzung**: Google Translate API für automatische Übersetzung

## 📁 Projektstruktur

```
bewerbung-stationsservice/
├── index.html              # Hauptanwendungsdatei
├── config.js               # Konfigurationseinstellungen
├── utils.js                # Utility-Funktionen
├── locales/                # Übersetzungsdateien
│   ├── de.json            # Deutsche Übersetzungen
│   ├── en.json            # Englische Übersetzungen
│   └── uk.json            # Ukrainische Übersetzungen
├── data/                   # Beispieldatendateien
│   ├── lebenslauf_data.json
│   ├── lebenslauf_data_de.json
│   └── lebenslauf_data_en.json
├── templates/              # Dokumentvorlagen
│   ├── bewerbung.html     # Bewerbungsschreiben-Vorlage
│   └── lebenslauf.html    # Lebenslauf-Vorlage
├── assets/                 # Ressourcen (Screenshots, Daten)
├── package.json           # Projektkonfiguration
└── README.md              # Diese Datei
```

## 🎯 Zielposition

Dieser Generator ist speziell optimiert für:
- **Position**: Verschiedene Positionen im medizinischen Bereich
- **Unternehmen**: Universitätsklinikum Magdeburg
- **Branche**: Gesundheitswesen/Krankenhausdienstleistungen
- **Anforderungen**: Hygienebewusstsein, Patientenbetreuung, Teamarbeit

## 🌐 Unterstützte Sprachen

- **🇩🇪 Deutsch**: Hauptsprache
- **🇺🇸 Englisch**: Internationale Unterstützung
- **🇺🇦 Ukrainisch**: Muttersprachen-Unterstützung

## 📱 Mobile Optimierung

### Responsive Breakpoints
- **Desktop**: > 1024px
- **Großes Tablet**: 768px - 1024px
- **Tablet**: 640px - 768px
- **Mobile Landschaft**: 480px - 640px
- **Mobile Porträt**: 360px - 480px
- **Kleines Mobile**: < 360px

### Mobile Features
- Hamburger-Menü mit ausklappbarem Panel
- Touch-freundliche Formulareingaben
- Optimierte Buttongrößen
- Responsive Grid-Layouts
- Mobile-spezifische Typografie

## 🚀 Erste Schritte

### Lokale Entwicklung

1. **Repository klonen**:
   ```bash
   git clone https://github.com/vutov/bewerbung-stationsservice.git
   cd bewerbung-stationsservice
   ```

2. **Lokalen Server starten**:
   ```bash
   # Mit Python
   python -m http.server 8000
   
   # Mit Node.js
   npm start
   ```

3. **Im Browser öffnen**:
   ```
   http://localhost:8000
   ```

### GitHub Pages Bereitstellung

1. **Dieses Repository forken**
2. **GitHub Pages aktivieren** in den Repository-Einstellungen
3. **Quelle auswählen**: Bereitstellung von einem Branch (main)
4. **Auf Ihre Website zugreifen**: `https://yourusername.github.io/bewerbung-stationsservice`

## 📝 Verwendung

1. **Formular ausfüllen** mit Ihren persönlichen und beruflichen Informationen
2. **Zwischen Sprachen wechseln** mit den Sprachflaggen
3. **Design umschalten** zwischen hellem und dunklem Modus
4. **Dokumente in Echtzeit anzeigen**
5. **Dokumente generieren und herunterladen** im HTML-, PDF- oder DOCX-Format
6. **Formate konvertieren** nach Bedarf für verschiedene Bewerbungen
7. **Google Translate verwenden** für automatische Feldübersetzung

## 🎨 Anpassung

### Neue Sprachen hinzufügen
1. Neue Übersetzungsdatei im `locales/` Ordner erstellen
2. Sprachflaggen-Button im HTML hinzufügen
3. Sprachwechsel-Logik aktualisieren

### Vorlagen modifizieren
1. Vorlagen im `templates/` Ordner bearbeiten
2. CSS-Stile für mobile Responsivität aktualisieren
3. Auf verschiedenen Bildschirmgrößen testen

## 📊 Leistung

- **Leichtgewichtig**: Keine externen Abhängigkeiten
- **Schnelles Laden**: Optimiertes CSS und JavaScript
- **Mobile optimiert**: Touch-freundliche Interaktionen
- **Zugänglich**: WCAG-konformes Design

## 🤝 Beitragen

1. Repository forken
2. Feature-Branch erstellen
3. Ihre Änderungen vornehmen
4. Auf mehreren Geräten testen
5. Pull Request einreichen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 👨‍💻 Autor

**Mykola Vutov**
- Email: vutov_mkola@icloud.com
- GitHub: [@vutov](https://github.com/vutov)

## 🙏 Danksagungen

- Universitätsklinikum Magdeburg für die Arbeitsmöglichkeit
- Moderne Web-Standards für responsives Design
- GitHub Pages für kostenloses Hosting
- Open-Source-Community für Inspiration

---

**Mit ❤️ für Arbeitssuchende in Deutschland erstellt**
