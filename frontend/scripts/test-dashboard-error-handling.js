#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function testTranslationFallbacks() {
  console.log("Testing Translation Fallback Utilities...\n");

  const fallbackPath = path.join(
    __dirname,
    "../lib/utils/translation-fallback.ts"
  );

  if (!fs.existsSync(fallbackPath)) {
    console.error("Translation fallback file not found");
    return false;
  }

  const fallbackContent = fs.readFileSync(fallbackPath, "utf8");

  if (fallbackContent.includes("CRITICAL_DASHBOARD_FALLBACKS")) {
    console.log("CRITICAL_DASHBOARD_FALLBACKS is defined");
  } else {
    console.log("CRITICAL_DASHBOARD_FALLBACKS is missing");
    return false;
  }

  if (fallbackContent.includes("useSafeTranslations")) {
    console.log("useSafeTranslations hook is defined");
  } else {
    console.log("useSafeTranslations hook is missing");
    return false;
  }

  if (fallbackContent.includes("validateDashboardTranslations")) {
    console.log("validateDashboardTranslations function is defined");
  } else {
    console.log("validateDashboardTranslations function is missing");
    return false;
  }

  if (fallbackContent.includes("de: {") && fallbackContent.includes("en: {")) {
    console.log("Both German and English fallbacks are present");
  } else {
    console.log("Missing German or English fallbacks");
    return false;
  }

  return true;
}

function testDashboardErrorBoundary() {
  console.log("\nTesting Dashboard Error Boundary...\n");

  const errorBoundaryPath = path.join(
    __dirname,
    "../components/dashboard-error-boundary.tsx"
  );

  if (!fs.existsSync(errorBoundaryPath)) {
    console.error("Dashboard error boundary file not found");
    return false;
  }

  const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, "utf8");

  if (errorBoundaryContent.includes("class DashboardErrorBoundary")) {
    console.log("DashboardErrorBoundary class is defined");
  } else {
    console.log("DashboardErrorBoundary class is missing");
    return false;
  }

  if (errorBoundaryContent.includes("componentDidCatch")) {
    console.log("componentDidCatch method is implemented");
  } else {
    console.log("componentDidCatch method is missing");
    return false;
  }

  if (errorBoundaryContent.includes("getDerivedStateFromError")) {
    console.log("getDerivedStateFromError method is implemented");
  } else {
    console.log("getDerivedStateFromError method is missing");
    return false;
  }

  if (errorBoundaryContent.includes("DashboardErrorBoundaryWrapper")) {
    console.log("DashboardErrorBoundaryWrapper is defined");
  } else {
    console.log("DashboardErrorBoundaryWrapper is missing");
    return false;
  }

  if (errorBoundaryContent.includes("safeTranslate")) {
    console.log("Safe translation access is implemented");
  } else {
    console.log("Safe translation access is missing");
    return false;
  }

  return true;
}

function testDashboardPageIntegration() {
  console.log("\nTesting Dashboard Page Integration...\n");

  const dashboardPagePath = path.join(
    __dirname,
    "../app/[lang]/dashboard/page.tsx"
  );

  if (!fs.existsSync(dashboardPagePath)) {
    console.error("Dashboard page file not found");
    return false;
  }

  const dashboardPageContent = fs.readFileSync(dashboardPagePath, "utf8");

  if (dashboardPageContent.includes("useSafeTranslations")) {
    console.log("useSafeTranslations is imported and used");
  } else {
    console.log("useSafeTranslations is not imported");
    return false;
  }

  if (dashboardPageContent.includes("DashboardErrorBoundaryWrapper")) {
    console.log("DashboardErrorBoundaryWrapper is imported and used");
  } else {
    console.log("DashboardErrorBoundaryWrapper is not imported");
    return false;
  }

  if (dashboardPageContent.includes("safeT(")) {
    console.log("safeT function is used for safe translations");
  } else {
    console.log("safeT function is not used");
    return false;
  }

  const criticalTranslations = [
    'safeT("title"',
    'safeT("welcome"',
    'safeT("states.error"',
    'safeT("actions.retry"',
    'safeT("metrics.activeOrders.title"',
    'safeT("roleContext.title"',
  ];

  let criticalTranslationsFound = 0;
  criticalTranslations.forEach((translation) => {
    if (dashboardPageContent.includes(translation)) {
      criticalTranslationsFound++;
    }
  });

  if (criticalTranslationsFound >= 3) {
    console.log(
      `Critical translations use safe fallbacks (${criticalTranslationsFound}/${criticalTranslations.length} found)`
    );
  } else {
    console.log(
      `Critical translations missing safe fallbacks (only ${criticalTranslationsFound}/${criticalTranslations.length} found)`
    );
    return false;
  }

  return true;
}

function testDashboardMetricCardIntegration() {
  console.log("\nTesting Dashboard Metric Card Integration...\n");

  const metricCardPath = path.join(
    __dirname,
    "../components/dashboard-metric-card.tsx"
  );

  if (!fs.existsSync(metricCardPath)) {
    console.error("Dashboard metric card file not found");
    return false;
  }

  const metricCardContent = fs.readFileSync(metricCardPath, "utf8");

  if (metricCardContent.includes("useSafeTranslations")) {
    console.log("useSafeTranslations is imported in metric card");
  } else {
    console.log("useSafeTranslations is not imported in metric card");
    return false;
  }

  if (metricCardContent.includes("DashboardErrorBoundaryWrapper")) {
    console.log("DashboardErrorBoundaryWrapper is used in metric card");
  } else {
    console.log("DashboardErrorBoundaryWrapper is not used in metric card");
    return false;
  }

  if (
    metricCardContent.includes('safeT("states.error"') ||
    metricCardContent.includes('safeT("actions.retry"')
  ) {
    console.log("Safe translations are used in error states");
  } else {
    console.log("Safe translations are not used in error states");
    return false;
  }

  return true;
}

function testTypeScriptSyntax() {
  console.log("\nTesting TypeScript Syntax...\n");

  const filesToCheck = [
    "../lib/utils/translation-fallback.ts",
    "../components/dashboard-error-boundary.tsx",
    "../app/[lang]/dashboard/page.tsx",
    "../components/dashboard-metric-card.tsx",
  ];

  let syntaxErrors = 0;

  filesToCheck.forEach((file) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");

      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      if (openBraces !== closeBraces) {
        console.log(`Mismatched braces in ${file}`);
        syntaxErrors++;
      } else if (openParens !== closeParens) {
        console.log(`Mismatched parentheses in ${file}`);
        syntaxErrors++;
      } else {
        console.log(`Basic syntax check passed for ${file}`);
      }
    } else {
      console.log(`File not found: ${file}`);
      syntaxErrors++;
    }
  });

  return syntaxErrors === 0;
}

function main() {
  console.log("Dashboard Error Handling Test Suite\n");

  let allTestsPassed = true;

  try {
    const tests = [
      testTranslationFallbacks,
      testDashboardErrorBoundary,
      testDashboardPageIntegration,
      testDashboardMetricCardIntegration,
      testTypeScriptSyntax,
    ];

    tests.forEach((test) => {
      if (!test()) {
        allTestsPassed = false;
      }
    });

    if (allTestsPassed) {
      console.log("\nAll dashboard error handling tests passed.");
      console.log("Translation fallback mechanisms are in place.");
      console.log("Error boundaries are configured.");
      console.log("Safe translation utilities are integrated.");
    } else {
      console.log("\nSome tests failed.");
      console.log("Review the failed tests and fix the issues.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\nTest suite failed with error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testTranslationFallbacks,
  testDashboardErrorBoundary,
  testDashboardPageIntegration,
  testDashboardMetricCardIntegration,
  testTypeScriptSyntax,
};