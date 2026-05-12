const baseUrl = process.env.LAJU_QA_BASE_URL ?? "http://localhost:3000";
const userA = process.env.LAJU_QA_USER_A ?? "qa-user-a";
const userB = process.env.LAJU_QA_USER_B ?? "qa-user-b";

function endpoint(path) {
  return `${baseUrl}${path}`;
}

async function request(path, options = {}, user = userA) {
  const response = await fetch(endpoint(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-laju-user-id": user,
      ...(options.headers ?? {})
    }
  });
  return response;
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} failed: expected ${expected}, got ${actual}`);
  }
}

async function run() {
  console.log(`Running Laju API QA against ${baseUrl}`);

  const health = await fetch(endpoint("/api/health"), { cache: "no-store" });
  assertStatus(health.status, 200, "health");

  const createA = await request(
    "/api/entries",
    {
      method: "POST",
      body: JSON.stringify({
        type: "job",
        title: "QA Entry A",
        company: "Laju QA",
        platform: "Direct",
        location: "Remote",
        currency: "IDR",
        value: "TBD",
        notes: "qa-api script"
      })
    },
    userA
  );
  assertStatus(createA.status, 201, "create A");
  const createdA = await createA.json();
  const entryAId = createdA.entry?.id;
  if (!entryAId) throw new Error("create A failed: missing entry id");

  const createB = await request(
    "/api/entries",
    {
      method: "POST",
      body: JSON.stringify({
        type: "freelance",
        title: "QA Entry B",
        company: "Laju QA",
        platform: "Direct",
        location: "Remote",
        currency: "USD",
        value: "1000",
        notes: "qa-api script"
      })
    },
    userB
  );
  assertStatus(createB.status, 201, "create B");

  const statusA = await request(
    "/api/entries/status",
    {
      method: "POST",
      body: JSON.stringify({ entryId: String(entryAId), status: "Interview" })
    },
    userA
  );
  assertStatus(statusA.status, 200, "status update A");

  const followUpA = await request(
    "/api/entries/follow-up",
    {
      method: "POST",
      body: JSON.stringify({ entryId: String(entryAId) })
    },
    userA
  );
  assertStatus(followUpA.status, 200, "follow-up A");

  const crossUpdate = await request(
    `/api/entries/${entryAId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ notes: "cross-user should fail" })
    },
    userB
  );
  assertStatus(crossUpdate.status, 404, "cross-user PATCH");

  const settingsA = await request(
    "/api/settings",
    {
      method: "PUT",
      body: JSON.stringify({
        jobReminderDays: 10,
        freelanceReminderDays: 6,
        currency: "IDR",
        aiEnabled: false
      })
    },
    userA
  );
  assertStatus(settingsA.status, 200, "settings PUT");

  const exportA = await request("/api/export", { method: "GET", headers: {} }, userA);
  assertStatus(exportA.status, 200, "export A");

  const deleteA = await request(`/api/entries/${entryAId}`, { method: "DELETE" }, userA);
  assertStatus(deleteA.status, 200, "delete A");

  console.log("Laju API QA PASSED");
}

run().catch((error) => {
  console.error("Laju API QA FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
