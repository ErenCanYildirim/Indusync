#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DE_TRANSLATIONS_PATH = path.join(__dirname, "../messages/de.json");
const EN_TRANSLATIONS_PATH = path.join(__dirname, "../messages/en.json");

const EXPECTED_DASHBOARD_KEYS = [
  "title",
  "welcome",
  "metrics.activeOrders.title",
  "metrics.activeOrders.description",
  "metrics.activeOrders.tooltip",
  "metrics.openApplications.title",
  "metrics.openApplications.description",
  "metrics.openApplications.tooltip",
  "metrics.completedOrders.title",
  "metrics.completedOrders.description",
  "metrics.completedOrders.tooltip",
  "metrics.averageResponseTime.title",
  "metrics.averageResponseTime.description",
  "metrics.averageResponseTime.tooltip",
  "sections.currentProjects.title",
  "sections.currentProjects.description",
  "sections.upcomingDeadlines.title",
  "sections.upcomingDeadlines.description",
  "sections.orderActivity.title",
  "sections.orderActivity.description",
  "roleContext.title",
  "roleContext.dualRole",
  "roleContext.clientOnly",
  "roleContext.providerOnly",
  "roleContext.determining",
  "periods.currentStatus",
  "periods.total",
  "periods.average",
  "trends.fast",
  "trends.normal",
  "trends.slow",
  "actions.viewAll",
  "actions.retry",
  "states.loading",
  "states.noData",
  "states.error",
];

function loadTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading translation file ${filePath}:`, error.message);
    return null;
  }
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function hasTranslationKey(translations, key) {
  if (!translations || !translations.Dashboard) {
    return false;
  }

  const value = getNestedValue(translations.Dashboard, key);
  return value !== undefined && value !== null && value !== "";
}

function validateTranslations() {
  console.log("Validating Dashboard Translation Keys...\n");

  const deTranslations = loadTranslations(DE_TRANSLATIONS_PATH);
  const enTranslations = loadTranslations(EN_TRANSLATIONS_PATH);

  if (!deTranslations || !enTranslations) {
    console.error("Failed to load translation files");
    process.exit(1);
  }

  let hasErrors = false;
  const missingKeys = {
    de: [],
    en: [],
  };

  EXPECTED_DASHBOARD_KEYS.forEach((key) => {
    const hasGerman = hasTranslationKey(deTranslations, key);
    const hasEnglish = hasTranslationKey(enTranslations, key);

    if (!hasGerman) {
      missingKeys.de.push(key);
      hasErrors = true;
    }

    if (!hasEnglish) {
      missingKeys.en.push(key);
      hasErrors = true;
    }

    const status = hasGerman && hasEnglish ? "[OK]" : "[FAIL]";
    const details = [];
    if (!hasGerman) details.push("DE missing");
    if (!hasEnglish) details.push("EN missing");

    console.log(
      `${status} Dashboard.${key}${
        details.length > 0 ? ` (${details.join(", ")})` : ""
      }`
    );
  });

  console.log("\nValidation Summary:");
  console.log(`Total keys checked: ${EXPECTED_DASHBOARD_KEYS.length}`);
  console.log(`German missing: ${missingKeys.de.length}`);
  console.log(`English missing: ${missingKeys.en.length}`);

  if (missingKeys.de.length > 0) {
    console.log("\nMissing German translations:");
    missingKeys.de.forEach((key) => console.log(`  - Dashboard.${key}`));
  }

  if (missingKeys.en.length > 0) {
    console.log("\nMissing English translations:");
    missingKeys.en.forEach((key) => console.log(`  - Dashboard.${key}`));
  }

  console.log("\nChecking for unused translation keys...");

  if (deTranslations.Dashboard) {
    const existingKeys = getAllKeys(deTranslations.Dashboard);
    const unusedKeys = existingKeys.filter(
      (key) => !EXPECTED_DASHBOARD_KEYS.includes(key)
    );

    if (unusedKeys.length > 0) {
      console.log("\nPotentially unused German translation keys:");
      unusedKeys.forEach((key) => console.log(`  - Dashboard.${key}`));
    }
  }

  if (enTranslations.Dashboard) {
    const existingKeys = getAllKeys(enTranslations.Dashboard);
    const unusedKeys = existingKeys.filter(
      (key) => !EXPECTED_DASHBOARD_KEYS.includes(key)
    );

    if (unusedKeys.length > 0) {
      console.log("\nPotentially unused English translation keys:");
      unusedKeys.forEach((key) => console.log(`  - Dashboard.${key}`));
    }
  }

  if (hasErrors) {
    console.log("\nTranslation validation failed.");
    console.log(
      "Add the missing translation keys to ensure proper dashboard functionality."
    );
    process.exit(1);
  } else {
    console.log("\nAll dashboard translation keys are present.");
    console.log("Dashboard internationalization is configured.");
  }
}

function getAllKeys(obj, prefix = "") {
  let keys = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        keys = keys.concat(getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

function validateFallbacks() {
  console.log("\nValidating Fallback Translations...\n");

  const fallbackPath = path.join(
    __dirname,
    "../lib/utils/translation-fallback.ts"
  );

  if (!fs.existsSync(fallbackPath)) {
    console.error("Fallback translation file not found");
    return false;
  }

  const fallbackContent = fs.readFileSync(fallbackPath, "utf8");

  const criticalKeys = [
    "title",
    "welcome",
    "states.loading",
    "states.error",
    "states.noData",
    "actions.retry",
    "actions.viewAll",
  ];

  let fallbacksValid = true;

  criticalKeys.forEach((key) => {
    const keyPattern = new RegExp(`['"]${key.replace(".", "\\.")}['"]:`);
    if (fallbackContent.match(keyPattern)) {
      console.log(`Fallback exists for: ${key}`);
    } else {
      console.log(`Missing fallback for: ${key}`);
      fallbacksValid = false;
    }
  });

  return fallbacksValid;
}

function main() {
  console.log("Dashboard Translation Validation\n");

  try {
    validateTranslations();
    const fallbacksValid = validateFallbacks();

    if (fallbacksValid) {
      console.log("\nFallback translations are configured.");
    } else {
      console.log("\nSome fallback translations are missing.");
      process.exit(1);
    }

    console.log("\nDashboard internationalization validation completed.");
  } catch (error) {
    console.error("\nValidation failed with error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateTranslations,
  validateFallbacks,
  EXPECTED_DASHBOARD_KEYS,
};