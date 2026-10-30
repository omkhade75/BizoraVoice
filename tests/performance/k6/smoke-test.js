import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';

export const options = {
  vus: 2,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% failure rate
    http_req_duration: ['p(95)<300'], // 95% of requests under 300ms
  },
};

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health returns healthy or degraded': (r) => r.body.includes('healthy'),
  });

  // 2. Agents list
  const agentsRes = http.get(`${BASE_URL}/api/agents`);
  check(agentsRes, {
    'agents status is 200': (r) => r.status === 200,
    'agents list non-empty': (r) => r.body.includes('marathi-supplier-agent'),
  });

  // 3. Voices list
  const voicesRes = http.get(`${BASE_URL}/api/voices`);
  check(voicesRes, {
    'voices status is 200': (r) => r.status === 200,
    'voices includes marathi voice': (r) => r.body.includes('mr-IN-AarohiNeural'),
  });

  sleep(0.5);
}
