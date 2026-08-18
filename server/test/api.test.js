import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { initializeRepository } from "../src/services/repository.js";

process.env.NODE_ENV = "test";
process.env.DEMO_MODE = "true";
process.env.JWT_SECRET = "test-only-secret";

let app;
let customerToken;
let providerToken;
let adminToken;

before(async () => {
  await initializeRepository();
  app = createApp();
  const credentials = [
    ["customer@novacare.demo", "customerToken"],
    ["provider@novacare.demo", "providerToken"],
    ["admin@novacare.demo", "adminToken"],
  ];
  for (const [email, key] of credentials) {
    const response = await request(app).post("/api/auth/login").send({ email, password: "Demo123!" });
    if (key === "customerToken") customerToken = response.body.data.token;
    if (key === "providerToken") providerToken = response.body.data.token;
    if (key === "adminToken") adminToken = response.body.data.token;
  }
});

function nextWeekday() {
  const date = new Date();
  do { date.setDate(date.getDate() + 1); } while ([0, 6].includes(date.getDay()));
  return date.toISOString().slice(0, 10);
}

describe("NovaCare API", () => {
  test("reports health and demo database mode", async () => {
    const response = await request(app).get("/api/health").expect(200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.database, "demo");
  });

  test("rejects protected requests without a session", async () => {
    const response = await request(app).get("/api/appointments").expect(401);
    assert.match(response.body.message, /sign in/i);
  });

  test("lists the service catalog and matching providers", async () => {
    const services = await request(app).get("/api/services").expect(200);
    assert.equal(services.body.data.length, 4);
    const providers = await request(app).get("/api/providers?serviceId=svc_general").expect(200);
    assert.equal(providers.body.data[0].displayName, "Dr. Sarah Chen");
  });

  test("calculates slots and prevents a double booking", async () => {
    const date = nextWeekday();
    const slotResponse = await request(app)
      .get(`/api/availability/slots?providerId=prv_sarah&serviceId=svc_general&date=${date}`)
      .expect(200);
    assert.ok(slotResponse.body.data.length > 0);
    const startAt = slotResponse.body.data[0].startAt;
    const payload = { providerId: "prv_sarah", serviceId: "svc_general", startAt, notes: "API test" };
    await request(app).post("/api/appointments").set("Authorization", `Bearer ${customerToken}`).send(payload).expect(201);
    const conflict = await request(app).post("/api/appointments").set("Authorization", `Bearer ${customerToken}`).send(payload).expect(409);
    assert.match(conflict.body.message, /choose another/i);
  });

  test("enforces roles and valid provider status transitions", async () => {
    await request(app)
      .put("/api/appointments/apt_sarah_today_2/status")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "confirmed" })
      .expect(403);
    const response = await request(app)
      .put("/api/appointments/apt_sarah_today_2/status")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "confirmed" })
      .expect(200);
    assert.equal(response.body.data.status, "confirmed");
  });

  test("lets admins add a validated service", async () => {
    const response = await request(app)
      .post("/api/admin/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Physiotherapy session",
        description: "Movement-focused care with a tailored recovery plan.",
        durationMinutes: 45,
        price: 105,
        category: "Rehabilitation",
        icon: "sparkles",
        accent: "sage",
      })
      .expect(201);
    assert.equal(response.body.data.name, "Physiotherapy session");
  });
});
