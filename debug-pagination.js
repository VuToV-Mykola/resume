// Скрипт для виконання debug функції pagination
const puppeteer = require('puppeteer');

async function runPaginationDebug() {
    let browser;
    try {
        // Запуск браузера
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Перехід на локальний сайт
        console.log('🔄 Завантаження сторінки http://localhost:8080...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });

        // Очікування завантаження всіх елементів
        await page.waitForTimeout(2000);

        // Виконання debug функції
        console.log('🔧 Виконання debugTestPagination()...');
        const debugResult = await page.evaluate(() => {
            // Перевірка наявності функції
            if (typeof window.debugTestPagination === 'function') {
                // Захоплення console.log виводу
                const logs = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    logs.push(args.join(' '));
                    originalLog(...args);
                };

                // Виконання debug функції
                window.debugTestPagination();

                // Відновлення оригінального console.log
                console.log = originalLog;

                return {
                    success: true,
                    logs: logs,
                    activeTab: window.getCurrentActiveTab ? window.getCurrentActiveTab() : 'не визначено',
                    bewerbungPages: document.querySelectorAll('#bewerbung-content .document-page').length,
                    lebenslaufPages: document.querySelectorAll('#lebenslauf-content .document-page').length
                };
            } else {
                return {
                    success: false,
                    error: 'debugTestPagination функція не знайдена'
                };
            }
        });

        // Вивід результатів
        console.log('\n📊 РЕЗУЛЬТАТИ DEBUG АНАЛІЗУ:');
        console.log('================================');

        if (debugResult.success) {
            console.log(`🎯 Активна вкладка: ${debugResult.activeTab}`);
            console.log(`📄 Bewerbung сторінки: ${debugResult.bewerbungPages}`);
            console.log(`📄 Lebenslauf сторінки: ${debugResult.lebenslaufPages}`);
            console.log('\n📝 Детальні логи:');
            debugResult.logs.forEach((log, index) => {
                console.log(`${index + 1}. ${log}`);
            });
        } else {
            console.log(`❌ Помилка: ${debugResult.error}`);
        }

    } catch (error) {
        console.error('❌ Помилка виконання:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Перевірка залежностей
console.log('🚀 Запуск debug аналізу pagination...');
runPaginationDebug();