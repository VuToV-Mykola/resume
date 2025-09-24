/**
 * Сервіс попереднього перегляду
 * Генерація та управління превью документів
 * Підтримує Anschreiben (супровідний лист) та Lebenslauf (резюме)
 */

class PreviewService {
  constructor() {
    this.currentPreviewType = 'lebenslauf';
    this.livePrintPreview = null;
    this.logger = null;
    this.translationService = null;
    this.domCache = null;
  }

  /**
   * Встановлення залежностей
   */
  setLogger(logger) {
    this.logger = logger;
  }

  setTranslationService(translationService) {
    this.translationService = translationService;
  }

  setDOMCache(domCache) {
    this.domCache = domCache;
  }

  setLivePrintPreview(livePrintPreview) {
    this.livePrintPreview = livePrintPreview;
  }

  /**
   * Логування з перевіркою
   */
  log(...args) {
    if (this.logger) {
      this.logger.log(...args);
    }
  }

  error(...args) {
    if (this.logger) {
      this.logger.error(...args);
    }
  }

  /**
   * Отримання перекладу
   */
  getTranslation(key) {
    if (this.translationService) {
      return this.translationService.getTranslation(key);
    }
    return null;
  }

  /**
   * Встановлення поточного типу превью
   * @param {string} type - тип превью ('bewerbung' або 'lebenslauf')
   */
  setCurrentPreviewType(type) {
    this.currentPreviewType = type;
  }

  /**
   * Отримання поточного типу превью
   * @returns {string} поточний тип превью
   */
  getCurrentPreviewType() {
    return this.currentPreviewType;
  }

  /**
   * Отримання поточних значень форми
   * @returns {Object} значення форми
   */
  getCurrentFormValues() {
    const getValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value.trim() : '';
    };

    return {
      // Основні поля
      fullName: getValue('fullName'),
      address: getValue('address'),
      phone: getValue('phone'),
      email: getValue('email'),
      birthDate: getValue('birthDate'),
      nationality: getValue('nationality'),

      // Поля роботодавця
      position: getValue('position'),
      company: getValue('company'),
      jobNumber: getValue('jobNumber'),
      contactName: getValue('contactName'),
      contactAddress: getValue('contactAddress'),
      contactPhone: getValue('contactPhone'),
      contactEmail: getValue('contactEmail'),

      // Контентні поля
      subject: getValue('subject'),
      greeting: getValue('greeting'),
      motivation: getValue('motivation'),
      qualifications: getValue('qualifications'),
      tasks: getValue('tasks'),
      future: getValue('future'),
      availability: getValue('availability'),
      closing: getValue('closing'),
      signature: getValue('signature'),

      // Lebenslauf поля
      lebenslaufFullName: getValue('lebenslaufFullName'),
      lebenslaufAddress: getValue('lebenslaufAddress'),
      lebenslaufPhone: getValue('lebenslaufPhone'),
      lebenslaufEmail: getValue('lebenslaufEmail'),
      lebenslaufBirthDate: getValue('lebenslaufBirthDate'),
      lebenslaufNationality: getValue('lebenslaufNationality'),
      lebenslaufSummary: getValue('lebenslaufSummary'),
      lebenslaufSkills: getValue('lebenslaufSkills'),
      lebenslaufExperience: getValue('lebenslaufExperience'),
      lebenslaufEducation: getValue('lebenslaufEducation'),
      lebenslaufCertifications: getValue('lebenslaufCertifications'),
      lebenslaufLanguages: getValue('lebenslaufLanguages'),
      lebenslaufAdditional: getValue('lebenslaufAdditional'),

      // Стилізація
      subjectColor: getValue('subjectColor') || '#1a5490'
    };
  }

  /**
   * Отримання активної вкладки
   * @returns {string} тип активної вкладки
   */
  getCurrentActiveTab() {
    const activeTab = document.querySelector('.preview-tab.active');
    if (activeTab) {
      const tabText = activeTab.textContent.toLowerCase();
      return tabText.includes('anschreiben') ? 'bewerbung' : 'lebenslauf';
    }
    return this.currentPreviewType;
  }

  /**
   * Генерація HTML для супровідного листа
   * @param {Object} values - значення форми
   * @param {string} globalPhotoData - дані фото
   * @returns {string} HTML контент
   */
  generateBewerbungHTML(values, globalPhotoData) {
    const {
      fullName, address, email, phone, company, contactName,
      contactAddress, contactPhone, contactEmail, subject,
      jobNumber, subjectColor, greeting, motivation,
      qualifications, tasks, future, availability, closing, signature
    } = values;

    // Отримання перекладів
    const translations = {
      phone: this.getTranslation('preview.phone') || 'Tel',
      email: this.getTranslation('preview.email') || 'Email',
      subject: this.getTranslation('preview.subject') || 'Betreff',
      jobRef: this.getTranslation('preview.jobRef') || 'Stellenausschreibung',
      date: this.getTranslation('preview.date') || 'Datum'
    };

    const currentDate = new Date().toLocaleDateString('de-DE');
    const photoHTML = globalPhotoData
      ? `<div class="photo-section"><img src="${globalPhotoData}" alt="Bewerbungsfoto" /></div>`
      : '';

    return `
      <div class="document-container bewerbung">
        <div class="header-section">
          <div class="personal-info">
            <div class="name">${fullName}</div>
            <div class="contact-line">${address}</div>
            <div class="contact-line">${translations.phone}: ${phone}</div>
            <div class="contact-line">${translations.email}: ${email}</div>
          </div>
          ${photoHTML}
        </div>

        <div class="recipient-section">
          <div class="company-info">
            <div class="company-name">${company}</div>
            <div class="contact-person">${contactName}</div>
            <div class="company-address">${contactAddress}</div>
            <div class="company-phone">${translations.phone}: ${contactPhone}</div>
            <div class="company-email">${translations.email}: ${contactEmail}</div>
          </div>
          <div class="date-section">${currentDate}</div>
        </div>

        <div class="subject-section">
          <div class="subject-line" style="color: ${subjectColor}; font-weight: bold;">
            ${translations.subject}: ${subject}
          </div>
          ${jobNumber ? `<div class="job-reference">${translations.jobRef}: ${jobNumber}</div>` : ''}
        </div>

        <div class="content-section">
          <div class="greeting">${greeting}</div>

          <div class="content-block">
            <div class="paragraph">${motivation}</div>
            <div class="paragraph">${qualifications}</div>
            <div class="paragraph">${tasks}</div>
            <div class="paragraph">${future}</div>
            <div class="paragraph">${availability}</div>
          </div>

          <div class="closing-section">
            <div class="closing">${closing}</div>
            <div class="signature">${signature}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Генерація HTML для резюме
   * @param {Object} values - значення форми
   * @param {string} globalPhotoData - дані фото
   * @returns {string} HTML контент
   */
  generateLebenslaufHTML(values, globalPhotoData) {
    const {
      lebenslaufFullName, lebenslaufAddress, lebenslaufPhone,
      lebenslaufEmail, lebenslaufBirthDate, lebenslaufNationality,
      lebenslaufSummary, lebenslaufSkills, lebenslaufExperience,
      lebenslaufEducation, lebenslaufCertifications, lebenslaufLanguages,
      lebenslaufAdditional
    } = values;

    // Отримання перекладів
    const translations = {
      phone: this.getTranslation('preview.phone') || 'Telefon',
      email: this.getTranslation('preview.email') || 'E-Mail',
      birthDate: this.getTranslation('lebenslauf.birthDate') || 'Geburtsdatum',
      nationality: this.getTranslation('lebenslauf.nationality') || 'Staatsangehörigkeit',
      summary: this.getTranslation('lebenslauf.summary') || 'Zusammenfassung',
      skills: this.getTranslation('lebenslauf.skills') || 'Fähigkeiten',
      experience: this.getTranslation('lebenslauf.experience') || 'Berufserfahrung',
      education: this.getTranslation('lebenslauf.education') || 'Bildung',
      certifications: this.getTranslation('lebenslauf.certifications') || 'Zertifizierungen',
      languages: this.getTranslation('lebenslauf.languages') || 'Sprachen',
      additional: this.getTranslation('lebenslauf.additional') || 'Zusätzliche Informationen'
    };

    const photoHTML = globalPhotoData
      ? `<div class="photo-section"><img src="${globalPhotoData}" alt="Profilbild" /></div>`
      : '';

    return `
      <div class="document-container lebenslauf">
        <div class="header-section">
          <div class="personal-info">
            <div class="name">${lebenslaufFullName}</div>
            <div class="contact-line">${lebenslaufAddress}</div>
            <div class="contact-line">${translations.phone}: ${lebenslaufPhone}</div>
            <div class="contact-line">${translations.email}: ${lebenslaufEmail}</div>
            <div class="personal-details">
              <div class="detail-line">${translations.birthDate}: ${lebenslaufBirthDate}</div>
              <div class="detail-line">${translations.nationality}: ${lebenslaufNationality}</div>
            </div>
          </div>
          ${photoHTML}
        </div>

        <div class="content-section">
          ${lebenslaufSummary ? `
            <div class="cv-section">
              <h3>${translations.summary}</h3>
              <div class="section-content">${lebenslaufSummary}</div>
            </div>
          ` : ''}

          ${lebenslaufSkills ? `
            <div class="cv-section">
              <h3>${translations.skills}</h3>
              <div class="section-content">${lebenslaufSkills}</div>
            </div>
          ` : ''}

          ${lebenslaufExperience ? `
            <div class="cv-section">
              <h3>${translations.experience}</h3>
              <div class="section-content">${lebenslaufExperience}</div>
            </div>
          ` : ''}

          ${lebenslaufEducation ? `
            <div class="cv-section">
              <h3>${translations.education}</h3>
              <div class="section-content">${lebenslaufEducation}</div>
            </div>
          ` : ''}

          ${lebenslaufCertifications ? `
            <div class="cv-section">
              <h3>${translations.certifications}</h3>
              <div class="section-content">${lebenslaufCertifications}</div>
            </div>
          ` : ''}

          ${lebenslaufLanguages ? `
            <div class="cv-section">
              <h3>${translations.languages}</h3>
              <div class="section-content">${lebenslaufLanguages}</div>
            </div>
          ` : ''}

          ${lebenslaufAdditional ? `
            <div class="cv-section">
              <h3>${translations.additional}</h3>
              <div class="section-content">${lebenslaufAdditional}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Головна функція показу превью
   * @param {string} type - тип документа ('bewerbung' або 'lebenslauf')
   * @param {string} globalPhotoData - дані фото
   * @returns {Promise<boolean>} успішність операції
   */
  async showPreview(type, globalPhotoData = null) {
    try {
      // Визначення типу превью
      const activeTab = this.getCurrentActiveTab();
      const previewType = type || activeTab;

      // Оновлення поточного типу
      this.currentPreviewType = previewType;

      this.log('showPreview called with type:', type, 'active tab:', activeTab, 'final preview type:', previewType);

      // Отримання поточних значень форми
      const currentFormValues = this.getCurrentFormValues();
      this.log('Current form values:', currentFormValues);

      // Активація відповідної вкладки
      this.activatePreviewTab(previewType);

      // Генерація контенту залежно від типу
      let htmlContent;
      if (previewType === 'bewerbung') {
        htmlContent = this.generateBewerbungHTML(currentFormValues, globalPhotoData);
      } else {
        htmlContent = this.generateLebenslaufHTML(currentFormValues, globalPhotoData);
      }

      // Відображення контенту
      const previewContent = this.domCache ? this.domCache.get('previewContent') : document.getElementById('previewContent');
      if (previewContent) {
        previewContent.innerHTML = htmlContent;

        // Використання LivePrintPreview якщо доступно
        if (this.livePrintPreview && this.livePrintPreview.enabled) {
          this.livePrintPreview.updatePreview();
        }

        this.log('Preview updated successfully');
      }

      return true;

    } catch (error) {
      this.error('Error in showPreview:', error);

      const previewContent = this.domCache ? this.domCache.get('previewContent') : document.getElementById('previewContent');
      if (previewContent) {
        previewContent.innerHTML = `
          <div class="error-state">
            <div class="icon">⚠️</div>
            <h3>Помилка завантаження превью</h3>
            <p>Сталася помилка при завантаженні превью: ${error.message}</p>
          </div>
        `;
      }

      return false;
    }
  }

  /**
   * Активація відповідної вкладки превью
   * @param {string} previewType - тип превью
   */
  activatePreviewTab(previewType) {
    const tabs = document.querySelectorAll('.preview-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Знаходження потрібної вкладки
    const targetTab = Array.from(tabs).find(tab =>
      tab.textContent.includes(previewType === 'bewerbung' ? 'Anschreiben' : 'Lebenslauf')
    );

    if (targetTab) {
      targetTab.classList.add('active');
      this.log('Activated tab:', targetTab.textContent);
    }
  }

  /**
   * Оновлення превью (зовнішній інтерфейс)
   * @param {string} type - тип документа
   * @param {string} globalPhotoData - дані фото
   */
  async updatePreview(type, globalPhotoData) {
    return await this.showPreview(type, globalPhotoData);
  }
}

// Експорт singleton instance
const previewService = new PreviewService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = previewService;
} else if (typeof window !== 'undefined') {
  window.previewService = previewService;
}