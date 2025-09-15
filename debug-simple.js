// Простий скрипт для отримання інформації про pagination через fetch API
const http = require('http');

function fetchPageAndAnalyze() {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/',
        method: 'GET'
    };

    console.log('🔄 Завантаження HTML сторінки...');

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('✅ HTML завантажено, розмір:', data.length, 'символів');

            // Пошук функції debugTestPagination в коді
            const hasDebugFunction = data.includes('window.debugTestPagination');
            console.log('🔧 debugTestPagination функція присутня:', hasDebugFunction);

            // Пошук елементів pagination
            const bewerbungMatches = data.match(/#bewerbung-content[^}]*\.document-page/g) || [];
            const lebenslaufMatches = data.match(/#lebenslauf-content[^}]*\.document-page/g) || [];

            console.log('\n📊 АНАЛІЗ СТРУКТУРИ PAGINATION:');
            console.log('================================');
            console.log('🔍 Пошук bewerbung pagination стилів:', bewerbungMatches.length);
            console.log('🔍 Пошук lebenslauf pagination стилів:', lebenslaufMatches.length);

            // Пошук характерних фрагментів pagination коду
            const paginationKeywords = [
                'createDynamicPagination',
                'CHARACTERS_PER_PAGE',
                'document-page',
                'performIntelligentPagination'
            ];

            console.log('\n📝 ПЕРЕВІРКА КЛЮЧОВИХ ФУНКЦІЙ:');
            paginationKeywords.forEach(keyword => {
                const count = (data.match(new RegExp(keyword, 'g')) || []).length;
                console.log(`- ${keyword}: ${count} входжень`);
            });

            // Пошук налаштувань символів на сторінку
            const charLimits = data.match(/CHARACTERS_PER_PAGE\s*=\s*\d+/g) || [];
            console.log('\n⚙️ ЗНАЙДЕНІ ЛІМІТИ СИМВОЛІВ:');
            charLimits.forEach(limit => {
                console.log(`- ${limit}`);
            });

            console.log('\n✨ ГОТОВО! Для детального тестування відкрийте http://localhost:8080 у браузері і виконайте debugTestPagination() в консолі.');
        });
    });

    req.on('error', (err) => {
        console.error('❌ Помилка:', err.message);
    });

    req.end();
}

fetchPageAndAnalyze();