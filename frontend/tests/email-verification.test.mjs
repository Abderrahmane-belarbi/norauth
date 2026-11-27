import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import {
  getCooldownSeconds,
  getRemainingSeconds,
  readCooldownDeadline,
  saveCooldownDeadline,
} from "../src/lib/email-verification.ts";

// Use the app's existing bundler to load its TypeScript and Vite environment.
const bundle = await build({
  configFile: false,
  envDir: false,
  logLevel: "silent",
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("https://auth.example.test"),
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL("../src/store/auth.store.ts", import.meta.url)),
      formats: ["es"],
    },
    write: false,
    minify: false,
    target: "es2023",
  },
});
const { output } = Array.isArray(bundle) ? bundle[0] : bundle;
const entry = output.find((item) => item.type === "chunk" && item.isEntry);
const { useAuth } = await import(
  `data:text/javascript;base64,${Buffer.from(entry.code).toString("base64")}`
);

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withStorage(t, storage) {
  const previousWindow = globalThis.window;
  globalThis.window = { sessionStorage: storage };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
}

test("cooldown configuration rejects invalid values", () => {
  assert.equal(getCooldownSeconds("45"), 45);
  for (const value of [undefined, "invalid", "0", "-1", "Infinity"]) {
    assert.equal(getCooldownSeconds(value), 60);
  }
});

test("countdown uses elapsed time rather than the number of timer callbacks", () => {
  const deadline = 61_000;
  assert.equal(getRemainingSeconds(deadline, 1_000), 60);
  assert.equal(getRemainingSeconds(deadline, 31_500), 30);
  assert.equal(getRemainingSeconds(deadline, 90_000), 0);
  assert.equal(getRemainingSeconds(Number.NaN, 1_000), 0);
});

test("saved cooldown survives rereading and belongs to one email", (t) => {
  const values = new Map();
  withStorage(t, {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  const deadline = saveCooldownDeadline(" Student@Example.com ", 60, "test", 1_000);
  assert.equal(readCooldownDeadline("student@example.com", "test"), deadline);
  assert.equal(readCooldownDeadline("another@example.com", "test"), 0);
  assert.equal(getRemainingSeconds(readCooldownDeadline("student@example.com", "test"), 11_000), 50);
});

test("malformed browser timestamps cannot create a broken countdown", (t) => {
  let storedValue;
  withStorage(t, { getItem: () => storedValue });
  for (const value of [null, "NaN", "Infinity", "invalid", "-1"]) {
    storedValue = value;
    assert.equal(readCooldownDeadline("student@example.com", "test"), 0);
  }
});

test("blocked storage still returns a usable in-memory deadline", (t) => {
  withStorage(t, {
    getItem: () => { throw new Error("Storage blocked"); },
    setItem: () => { throw new Error("Storage blocked"); },
  });
  assert.equal(readCooldownDeadline("student@example.com", "test"), 0);
  assert.equal(saveCooldownDeadline("student@example.com", 60, "test", 1_000), 61_000);
});

test("a 429 preserves both its message and retry time", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    jsonResponse({ message: "Please wait", retryAfterSeconds: 37 }, 429),
  );
  await assert.rejects(useAuth.getState().resendVerificationEmail("student@example.com"), {
    status: 429,
    retryAfterSeconds: 37,
    message: "Please wait",
  });
  assert.deepEqual(useAuth.getState().data, { error: "Please wait", retryAfter: 37 });
  assert.equal(useAuth.getState().isLoading, false);
});

test("a new request clears stale errors and returns the server cooldown", async (t) => {
  let finishRequest;
  t.mock.method(globalThis, "fetch", (url, options) => {
    assert.equal(url, "https://auth.example.test/auth/resend-verification-email");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { email: "student@example.com" });
    return new Promise((resolve) => { finishRequest = resolve; });
  });
  useAuth.setState({ data: { error: "Old error", retryAfter: 10 } });
  const pending = useAuth.getState().resendVerificationEmail(" student@example.com ");
  assert.equal(useAuth.getState().data, undefined);
  assert.equal(useAuth.getState().isLoading, true);
  finishRequest(jsonResponse({ message: "Email sent", retryAfterSeconds: 55 }));
  assert.deepEqual(await pending, { message: "Email sent", retryAfterSeconds: 55 });
  assert.equal(useAuth.getState().data.error, undefined);
  assert.equal(useAuth.getState().isLoading, false);
});

test("delivery failures can retain the server's cooldown", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    jsonResponse({ message: "Delivery failed", retryAfterSeconds: 18 }, 503),
  );
  await assert.rejects(useAuth.getState().resendVerificationEmail("student@example.com"), {
    status: 503,
    retryAfterSeconds: 18,
  });
  assert.equal(useAuth.getState().data.retryAfter, 18);
});

test("verification shares an in-flight request for the same token", async (t) => {
  let requests = 0;
  let finishRequest;
  t.mock.method(globalThis, "fetch", (url, options) => {
    requests++;
    assert.equal(url, "https://auth.example.test/auth/verify-email");
    assert.deepEqual(JSON.parse(options.body), { token: "verification-token" });
    return new Promise((resolve) => { finishRequest = resolve; });
  });
  const first = useAuth.getState().verifyEmail("verification-token");
  const second = useAuth.getState().verifyEmail("verification-token");
  assert.equal(first, second);
  assert.equal(requests, 1);
  finishRequest(jsonResponse({ message: "Email verified" }));
  assert.deepEqual(await Promise.all([first, second]), ["Email verified", "Email verified"]);
  assert.equal(useAuth.getState().isLoading, false);
});

test("rejected verification never becomes success and can be retried", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return requests === 1
      ? jsonResponse({ message: "Verification link expired" }, 400)
      : jsonResponse({ message: "Email verified" });
  });
  await assert.rejects(useAuth.getState().verifyEmail("expired-token"), {
    status: 400,
    message: "Verification link expired",
  });
  assert.equal(useAuth.getState().data.message, undefined);
  assert.equal(await useAuth.getState().verifyEmail("expired-token"), "Email verified");
  assert.equal(requests, 2);
});

test("network failures clear loading and do not keep an old cooldown", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Network unavailable"); });
  await assert.rejects(useAuth.getState().resendVerificationEmail("student@example.com"), {
    message: "Network unavailable",
  });
  assert.equal(useAuth.getState().data.retryAfter, undefined);
  assert.equal(useAuth.getState().isLoading, false);
});

test("non-JSON API failures receive a useful error message", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("Gateway unavailable", { status: 502 }));
  await assert.rejects(useAuth.getState().verifyEmail("gateway-token"), {
    status: 502,
    message: "Could not verify your email. Please try again.",
  });
  assert.equal(useAuth.getState().isLoading, false);
});
