// ============================================================
// LIGHTWEIGHT CONCURRENT LOAD & STRESS TESTING SCRIPT
// Simulates 50-100 concurrent requests to test latency,
// error rate, and memory pressure before handing to users.
// ============================================================

const http = require("http");
const https = require("https");

const TARGET_HOST = process.argv[2] || "crm-admin.digiinksolutions.com";
const CONCURRENCY = parseInt(process.argv[3], 10) || 50;
const TOTAL_REQUESTS = parseInt(process.argv[4], 10) || 200;

console.log(`====================================================`);
console.log(`🚀 Solar CRM Multi-Tenant SaaS Load Test`);
console.log(`Target: https://${TARGET_HOST}`);
console.log(`Concurrency: ${CONCURRENCY} simultaneous connections`);
console.log(`Total Requests: ${TOTAL_REQUESTS}`);
console.log(`====================================================\n`);

let completed = 0;
let successes = 0;
let failures = 0;
const latencies = [];
const startTime = Date.now();

function makeRequest() {
  const reqStart = Date.now();
  const req = https.get(`https://${TARGET_HOST}/`, { timeout: 10000 }, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      const duration = Date.now() - reqStart;
      latencies.push(duration);
      if (res.statusCode >= 200 && res.statusCode < 400) {
        successes++;
      } else {
        failures++;
      }
      onComplete();
    });
  });

  req.on("error", (err) => {
    failures++;
    onComplete();
  });

  req.on("timeout", () => {
    req.destroy();
    failures++;
    onComplete();
  });
}

let active = 0;
let dispatched = 0;

function pump() {
  while (active < CONCURRENCY && dispatched < TOTAL_REQUESTS) {
    dispatched++;
    active++;
    makeRequest();
  }
}

function onComplete() {
  active--;
  completed++;
  if (completed < TOTAL_REQUESTS) {
    pump();
  } else {
    printResults();
  }
}

function printResults() {
  const totalDurationMs = Date.now() - startTime;
  latencies.sort((a, b) => a - b);
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = ((completed / (totalDurationMs / 1000))).toFixed(2);

  console.log(`\n================== TEST RESULTS ==================`);
  console.log(`Total Duration:      ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log(`Requests Completed:  ${completed} / ${TOTAL_REQUESTS}`);
  console.log(`Successful (2xx/3xx): ${successes}`);
  console.log(`Failed / Timed Out:  ${failures}`);
  console.log(`Requests Per Second: ${rps} req/sec`);
  console.log(`--------------------------------------------------`);
  console.log(`Average Latency:     ${avg} ms`);
  console.log(`p50 (Median):        ${p50} ms`);
  console.log(`p95:                 ${p95} ms`);
  console.log(`p99:                 ${p99} ms`);
  console.log(`==================================================\n`);

  if (failures === 0 && avg < 300) {
    console.log(`🎯 PASS: Server is highly performant and user-ready!`);
  } else if (failures > 0) {
    console.log(`⚠️ WARN: Encountered failures under high load.`);
  }
}

pump();
