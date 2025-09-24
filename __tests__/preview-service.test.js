/**
 * Unit тести для Preview Service
 * Тестування сервісу попереднього перегляду документів
 */

// Mock document methods
document.getElementById = jest.fn((id) => ({
  value: `mock-${id}-value`,
  textContent: `mock-${id}-content`
}));

document.querySelector = jest.fn();
document.querySelectorAll = jest.fn(() => []);

const previewService = require('../js/services/preview-service.js');

describe('PreviewService', () => {
  let mockLogger, mockTranslationService;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn()
    };

    mockTranslationService = {
      getTranslation: jest.fn((key) => `translated-${key}`)
    };

    // Скинути стан
    previewService.currentPreviewType = 'lebenslauf';
    previewService.setLogger(mockLogger);
    previewService.setTranslationService(mockTranslationService);

    document.querySelector.mockClear();
    document.querySelectorAll.mockClear();
  });

  describe('Базові методи', () => {
    test('встановлює logger', () => {
      const testLogger = { log: jest.fn(), error: jest.fn() };
      previewService.setLogger(testLogger);
      previewService.log('test');
      expect(testLogger.log).toHaveBeenCalledWith('test');
    });

    test('встановлює translation service', () => {
      const testTranslation = { getTranslation: jest.fn(() => 'test') };
      previewService.setTranslationService(testTranslation);
      const result = previewService.getTranslation('test.key');
      expect(testTranslation.getTranslation).toHaveBeenCalledWith('test.key');
      expect(result).toBe('test');
    });

    test('встановлює поточний тип превью', () => {
      previewService.setCurrentPreviewType('bewerbung');
      expect(previewService.getCurrentPreviewType()).toBe('bewerbung');
    });
  });

  describe('getCurrentFormValues', () => {
    test('повертає значення форм', () => {
      const values = previewService.getCurrentFormValues();

      expect(values).toHaveProperty('fullName');
      expect(values).toHaveProperty('email');
      expect(values).toHaveProperty('lebenslaufFullName');
      expect(values.fullName).toBe('mock-fullName-value');
      expect(values.email).toBe('mock-email-value');
    });

    test('включає всі необхідні поля', () => {
      const values = previewService.getCurrentFormValues();

      // Основні поля
      expect(values).toHaveProperty('fullName');
      expect(values).toHaveProperty('address');
      expect(values).toHaveProperty('phone');
      expect(values).toHaveProperty('email');

      // Поля роботодавця
      expect(values).toHaveProperty('company');
      expect(values).toHaveProperty('position');

      // Lebenslauf поля
      expect(values).toHaveProperty('lebenslaufFullName');
      expect(values).toHaveProperty('lebenslaufSummary');
      expect(values).toHaveProperty('lebenslaufSkills');
    });
  });

  describe('getCurrentActiveTab', () => {
    test('повертає тип активної вкладки', () => {
      const mockTab = { textContent: 'Anschreiben' };
      document.querySelector.mockReturnValue(mockTab);

      const result = previewService.getCurrentActiveTab();
      expect(result).toBe('bewerbung');
    });

    test('повертає lebenslauf для Lebenslauf вкладки', () => {
      const mockTab = { textContent: 'Lebenslauf' };
      document.querySelector.mockReturnValue(mockTab);

      const result = previewService.getCurrentActiveTab();
      expect(result).toBe('lebenslauf');
    });

    test('повертає поточний тип якщо активна вкладка не знайдена', () => {
      document.querySelector.mockReturnValue(null);
      previewService.currentPreviewType = 'bewerbung';

      const result = previewService.getCurrentActiveTab();
      expect(result).toBe('bewerbung');
    });
  });

  describe('generateBewerbungHTML', () => {
    test('генерує HTML для супровідного листа', () => {
      const values = {
        fullName: 'John Doe',
        address: '123 Main St',
        email: 'john@example.com',
        phone: '+49 123 456789',
        company: 'Test Company',
        subject: 'Test Subject',
        greeting: 'Dear Sir',
        motivation: 'Test motivation',
        closing: 'Best regards',
        signature: 'John Doe',
        subjectColor: '#1a5490'
      };

      const html = previewService.generateBewerbungHTML(values, null);

      expect(html).toContain('John Doe');
      expect(html).toContain('123 Main St');
      expect(html).toContain('john@example.com');
      expect(html).toContain('Test Company');
      expect(html).toContain('Test Subject');
      expect(html).toContain('Dear Sir');
      expect(html).toContain('document-container bewerbung');
    });

    test('включає фото якщо надано', () => {
      const values = { fullName: 'John Doe' };
      const photoData = 'data:image/jpeg;base64,test123';

      const html = previewService.generateBewerbungHTML(values, photoData);

      expect(html).toContain('<div class="photo-section">');
      expect(html).toContain('src="data:image/jpeg;base64,test123"');
    });
  });

  describe('generateLebenslaufHTML', () => {
    test('генерує HTML для резюме', () => {
      const values = {
        lebenslaufFullName: 'Jane Smith',
        lebenslaufAddress: '456 Oak Ave',
        lebenslaufEmail: 'jane@example.com',
        lebenslaufSummary: 'Test summary',
        lebenslaufSkills: 'JavaScript, HTML, CSS'
      };

      const html = previewService.generateLebenslaufHTML(values, null);

      expect(html).toContain('Jane Smith');
      expect(html).toContain('456 Oak Ave');
      expect(html).toContain('jane@example.com');
      expect(html).toContain('Test summary');
      expect(html).toContain('JavaScript, HTML, CSS');
      expect(html).toContain('document-container lebenslauf');
    });

    test('пропускає порожні секції', () => {
      const values = {
        lebenslaufFullName: 'Jane Smith',
        lebenslaufSummary: '',
        lebenslaufSkills: 'JavaScript'
      };

      const html = previewService.generateLebenslaufHTML(values, null);

      expect(html).toContain('JavaScript');
      expect(html).not.toContain('cv-section');
    });
  });

  describe('activatePreviewTab', () => {
    test('активує відповідну вкладку', () => {
      const mockTabs = [
        { classList: { remove: jest.fn(), add: jest.fn() }, textContent: 'Anschreiben' },
        { classList: { remove: jest.fn(), add: jest.fn() }, textContent: 'Lebenslauf' }
      ];

      document.querySelectorAll.mockReturnValue(mockTabs);

      previewService.activatePreviewTab('bewerbung');

      // Перевірити що всі вкладки очищено
      mockTabs.forEach(tab => {
        expect(tab.classList.remove).toHaveBeenCalledWith('active');
      });

      // Перевірити що потрібна вкладка активована
      expect(mockTabs[0].classList.add).toHaveBeenCalledWith('active');
    });
  });
});