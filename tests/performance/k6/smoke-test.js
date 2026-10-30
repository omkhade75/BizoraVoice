import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 2,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // 1. Health Endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health has status field': (r) => JSON.parse(r.body).status !== undefined,
  });

  // 2. Platform Stats Endpoint
  const statsRes = http.get(`${BASE_URL}/api/stats`);
  check(statsRes, {
    'stats status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
