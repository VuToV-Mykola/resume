#!/usr/bin/env node

/**
 * Тестовий скрипт для перевірки динамічної пагінації
 * Запуск: node test-pagination.js
 */

const puppeteer = require("puppeteer")
const fs = require("fs")
const path = require("path")

// Кольорові логи
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function testPagination() {
  let browser

  try {
    log("\n🚀 Запуск тестування пагінації...", colors.bright)

    // Запуск браузера
    browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1400,900"]
    })

    const page = await browser.newPage()
    await page.setViewport({width: 1400, height: 900})

    // Перехід на локальний сайт
    log("📄 Завантаження сторінки http://localhost:8080...", colors.cyan)
    await page.goto("http://localhost:8080", {waitUntil: "networkidle0", timeout: 30000})

    // Очікування завантаження
    await page.waitForTimeout(2000)

    // Тест 1: Перевірка функцій пагінації
    log("\n📋 Тест 1: Перевірка наявності функцій пагінації", colors.yellow)
    const functionsExist = await page.evaluate(() => {
      return {
        createDynamicPagination: typeof window.createDynamicPagination === "function",
        performIntelligentPagination: typeof window.performIntelligentPagination === "function",
        getCurrentActiveTab: typeof window.getCurrentActiveTab === "function",
        wrapInPage: typeof window.wrapInPage === "function"
      }
    })

    for (const [func, exists] of Object.entries(functionsExist)) {
      if (exists) {
        log(`  ✅ ${func} знайдена`, colors.green)
      } else {
        log(`  ❌ ${func} не знайдена`, colors.red)
      }
    }

    // Тест 2: Тестування вкладки Bewerbung
    log("\n📋 Тест 2: Пагінація для Bewerbung", colors.yellow)

    // Клік на вкладку Bewerbung
    await page.evaluate(() => {
      const bewerbungTab = document.querySelector('.form-tab-button[onclick*="bewerbung"]')
      if (bewerbungTab) bewerbungTab.click()
    })
    await page.waitForTimeout(1000)

    // Генерація preview
    await page.evaluate(() => {
      if (typeof showPreview === "function") {
        showPreview("bewerbung")
      }
    })
    await page.waitForTimeout(2000)

    // Перевірка кількості сторінок
    const bewerbungPages = await page.evaluate(() => {
      const pages = document.querySelectorAll(".document-page")
      const pageInfo = []
      pages.forEach((page, index) => {
        const height = page.scrollHeight
        const elements = page.querySelectorAll("h1, h2, h3, p, div").length
        pageInfo.push({
          pageNum: index + 1,
          height: height,
          elements: elements,
          hasContent: page.textContent.trim().length > 0
        })
      })
      return pageInfo
    })

    log(`  📄 Знайдено сторінок: ${bewerbungPages.length}`, colors.cyan)
    bewerbungPages.forEach(page => {
      log(
        `    • Сторінка ${page.pageNum}: висота ${page.height}px, елементів ${page.elements}`,
        colors.reset
      )
    })

    // Тест 3: Тестування вкладки Lebenslauf
    log("\n📋 Тест 3: Пагінація для Lebenslauf", colors.yellow)

    // Клік на вкладку Lebenslauf
    await page.evaluate(() => {
      const lebenslaufTab = document.querySelector('.form-tab-button[onclick*="lebenslauf"]')
      if (lebenslaufTab) lebenslaufTab.click()
    })
    await page.waitForTimeout(1000)

    // Генерація preview
    await page.evaluate(() => {
      if (typeof showPreview === "function") {
        showPreview("lebenslauf")
      }
    })
    await page.waitForTimeout(2000)

    // Перевірка кількості сторінок
    const lebenslaufPages = await page.evaluate(() => {
      const pages = document.querySelectorAll(".document-page")
      const pageInfo = []
      pages.forEach((page, index) => {
        const height = page.scrollHeight
        const elements = page.querySelectorAll("h1, h2, h3, p, div, table").length
        pageInfo.push({
          pageNum: index + 1,
          height: height,
          elements: elements,
          hasContent: page.textContent.trim().length > 0
        })
      })
      return pageInfo
    })

    log(`  📄 Знайдено сторінок: ${lebenslaufPages.length}`, colors.cyan)
    lebenslaufPages.forEach(page => {
      log(
        `    • Сторінка ${page.pageNum}: висота ${page.height}px, елементів ${page.elements}`,
        colors.reset
      )
    })

    // Тест 4: Динамічне додавання контенту
    log("\n📋 Тест 4: Динамічне додавання контенту", colors.yellow)

    // Додаємо контент у форму
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea[name="lebenslaufBerufserfahrung"]')
      if (textarea) {
        textarea.value += "\n\n" + "Додатковий досвід роботи:\n".repeat(20)
        // Тригер події зміни
        textarea.dispatchEvent(new Event("input", {bubbles: true}))
      }
    })

    // Оновлюємо preview
    await page.evaluate(() => {
      if (typeof showPreview === "function") {
        showPreview("lebenslauf")
      }
    })
    await page.waitForTimeout(2000)

    // Перевірка зміни кількості сторінок
    const updatedPages = await page.evaluate(() => {
      return document.querySelectorAll(".document-page").length
    })

    log(`  📄 Сторінок після додавання контенту: ${updatedPages}`, colors.cyan)
    if (updatedPages > lebenslaufPages.length) {
      log(`  ✅ Пагінація динамічно оновилась!`, colors.green)
    } else {
      log(`  ⚠️ Кількість сторінок не змінилась`, colors.yellow)
    }

    // Тест 5: Перевірка CSS стилів
    log("\n📋 Тест 5: Перевірка CSS стилів A4", colors.yellow)

    const pageStyles = await page.evaluate(() => {
      const page = document.querySelector(".document-page")
      if (page) {
        const computedStyle = window.getComputedStyle(page)
        return {
          width: computedStyle.width,
          minHeight: computedStyle.minHeight,
          padding: computedStyle.padding,
          background: computedStyle.background
        }
      }
      return null
    })

    if (pageStyles) {
      log(`  📏 Ширина: ${pageStyles.width}`, colors.reset)
      log(`  📏 Мін. висота: ${pageStyles.minHeight}`, colors.reset)
      log(`  📏 Відступи: ${pageStyles.padding}`, colors.reset)

      // Перевірка A4 розмірів (210mm ширина)
      if (pageStyles.width.includes("210mm") || pageStyles.width.includes("794px")) {
        log(`  ✅ Розміри відповідають A4`, colors.green)
      } else {
        log(`  ⚠️ Розміри можуть не відповідати A4`, colors.yellow)
      }
    }

    // Збереження скріншоту
    log("\n📸 Збереження скріншоту результату...", colors.cyan)
    await page.screenshot({
      path: "test-pagination-result.png",
      fullPage: true
    })
    log("  ✅ Скріншот збережено як test-pagination-result.png", colors.green)

    // Підсумок
    log("\n" + "=".repeat(50), colors.bright)
    log("📊 ПІДСУМОК ТЕСТУВАННЯ:", colors.bright)
    log("=".repeat(50), colors.bright)

    const summary = {
      functionsOk: Object.values(functionsExist).every(v => v),
      bewerbungPages: bewerbungPages.length,
      lebenslaufPages: lebenslaufPages.length,
      dynamicUpdate: updatedPages > lebenslaufPages.length,
      a4Format:
        pageStyles && (pageStyles.width.includes("210mm") || pageStyles.width.includes("794px"))
    }

    log(
      `Функції пагінації: ${summary.functionsOk ? "✅ OK" : "❌ Помилка"}`,
      summary.functionsOk ? colors.green : colors.red
    )
    log(`Bewerbung сторінок: ${summary.bewerbungPages}`, colors.cyan)
    log(`Lebenslauf сторінок: ${summary.lebenslaufPages}`, colors.cyan)
    log(
      `Динамічне оновлення: ${summary.dynamicUpdate ? "✅ Працює" : "⚠️ Не працює"}`,
      summary.dynamicUpdate ? colors.green : colors.yellow
    )
    log(
      `Формат A4: ${summary.a4Format ? "✅ Правильний" : "⚠️ Перевірте"}`,
      summary.a4Format ? colors.green : colors.yellow
    )

    // Загальний результат
    const allPassed = Object.values(summary).every(v => v === true || typeof v === "number")
    log("\n" + "=".repeat(50), colors.bright)
    if (allPassed) {
      log("🎉 ВСІ ТЕСТИ ПРОЙДЕНО УСПІШНО!", colors.green + colors.bright)
    } else {
      log("⚠️ Деякі тести потребують уваги", colors.yellow + colors.bright)
    }
    log("=".repeat(50) + "\n", colors.bright)
  } catch (error) {
    log(`\n❌ Помилка виконання: ${error.message}`, colors.red)
    console.error(error)
  } finally {
    if (browser) {
      log("🔒 Закриття браузера...", colors.cyan)
      await browser.close()
    }
  }
}

// Перевірка, чи запущений сервер
const http = require("http")

function checkServer() {
  return new Promise(resolve => {
    http
      .get("http://localhost:8080", res => {
        resolve(true)
      })
      .on("error", () => {
        resolve(false)
      })
  })
}

// Головна функція
async function main() {
  log("=".repeat(50), colors.bright)
  log("🧪 ТЕСТУВАННЯ ДИНАМІЧНОЇ ПАГІНАЦІЇ", colors.bright + colors.cyan)
  log("=".repeat(50), colors.bright)

  // Перевірка сервера
  const serverRunning = await checkServer()

  if (!serverRunning) {
    log("\n⚠️ Сервер не запущений!", colors.yellow)
    log("Запустіть сервер командою: npm start", colors.reset)
    log("або: node server.js\n", colors.reset)
    process.exit(1)
  }

  log("✅ Сервер запущений на http://localhost:8080", colors.green)

  // Запуск тестів
  await testPagination()
}

// Запуск
main().catch(console.error)
