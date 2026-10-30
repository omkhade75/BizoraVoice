import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';

export const options = {
  stages: [
    { duration: '5s', target: 10 },  // Ramp-up to 10 users
    { duration: '15s', target: 25 }, // Sustain 25 concurrent users
    { duration: '5s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],   // <2% errors under heavy load
    http_req_duration: ['p(95)<500'], // 95% under 500ms
  },
};

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Health & Agents querying
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'status is 200': (r) => r.status === 200 });

  // 2. High concurrency call initialization
  const payload = JSON.stringify({
    agent_id: 'marathi-supplier-agent',
    custom_system_prompt: 'High-concurrency load test',
  });

  const callRes = http.post(`${BASE_URL}/api/calls/start`, payload, { headers });
  check(callRes, {
    'call started status 200': (r) => r.status === 200,
    'session_id returned': (r) => r.body.includes('session_id'),
    'ws_url returned': (r) => r.body.includes('/ws/call/'),
  });

  sleep(0.3);
}
