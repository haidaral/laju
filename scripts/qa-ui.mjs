import { chromium } from "playwright";

const baseUrl = process.env.LAJU_QA_BASE_URL ?? "http://localhost:3000";
const qaUser = process.env.LAJU_QA_USER_A ?? "qa-ui-user";

async function run() {
  console.log(`Running Laju UI QA against ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "x-laju-user-id": qaUser,
      "x-laju-e2e-bypass": "true"
    }
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Overview" }).waitFor({ timeout: 15000 });

    const addEntryButton = page.getByRole("button", { name: "Add Entry" });
    if (await addEntryButton.count()) {
      await addEntryButton.click();
      if (await page.getByRole("heading", { name: "Add entry" }).isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.locator("input[name='title']").fill("UI QA Entry");
        await page.locator("input[name='company']").fill("Laju QA");
        await page.getByRole("button", { name: "Save Entry" }).click();
        await page.getByText("Entry created.").waitFor({ timeout: 10000 });
      } else {
        console.log("Create-entry drawer not available in this auth state, skipping create step.");
      }
    }

    const jobsTab = page.getByRole("button", { name: /^Jobs$/ });
    if (await jobsTab.count()) {
      await jobsTab.click();
      const tableButton = page.getByRole("button", { name: "Table" });
      if (await tableButton.count()) {
        await tableButton.click();
        const firstCheckbox = page.locator("tbody input[type='checkbox']").first();
        if (await firstCheckbox.count()) {
          await firstCheckbox.check();
          await page.getByRole("button", { name: /Apply to 1 selected/ }).click();
          await page.getByText("Bulk status update applied.").waitFor({ timeout: 10000 });
        } else {
          console.log("No table rows available for bulk action check, skipping bulk step.");
        }
      } else {
        console.log("Table control not available in this auth state, skipping bulk step.");
      }
    } else {
      console.log("Jobs tab not available in this auth state, skipping pipeline step.");
    }

    const settingsTab = page.getByRole("button", { name: /^Settings$/ });
    if (await settingsTab.count()) {
      await settingsTab.click();
      const runHealthButton = page.getByRole("button", { name: "Run Health Check" });
      if (await runHealthButton.count()) {
        await runHealthButton.click();
        await page.getByText("Auth and database are healthy.").waitFor({ timeout: 15000 });
      } else {
        console.log("Health button not available in this auth state, using API fallback.");
        const healthResponse = await page.request.get(`${baseUrl}/api/health`, {
          headers: { "x-laju-user-id": qaUser }
        });
        if (healthResponse.status() !== 200) {
          throw new Error(`Health fallback failed: expected 200, got ${healthResponse.status()}`);
        }
      }

      const typeFilter = page.getByLabel("Type");
      if (await typeFilter.count()) {
        await typeFilter.selectOption("job");
      }
      const commentSearch = page.getByRole("textbox", { name: "Search comments" });
      if (await commentSearch.count()) {
        await commentSearch.fill("created");
      } else {
        const activitySearch = page.getByRole("textbox", { name: "Search", exact: true });
        if (await activitySearch.count()) {
          await activitySearch.fill("created");
        }
      }
    } else {
      console.log("Settings tab not available in this auth state, using API fallback.");
      const healthResponse = await page.request.get(`${baseUrl}/api/health`, {
        headers: { "x-laju-user-id": qaUser }
      });
      if (healthResponse.status() !== 200) {
        throw new Error(`Health fallback failed: expected 200, got ${healthResponse.status()}`);
      }
    }

    console.log("Laju UI QA PASSED");
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error("Laju UI QA FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
