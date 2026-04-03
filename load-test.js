import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp to 100 users over 5 min
    { duration: '20m', target: 100 },  // Hold 100 users for 20 min
    { duration: '5m', target: 500 },   // Ramp to 500 users over 5 min
    { duration: '20m', target: 500 },  // Hold 500 users for 20 min
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || 'test_admin_token';
const STUDENT_TOKEN = __ENV.STUDENT_TOKEN || 'test_student_token';

export default function() {
  const userId = __VU;
  const lessonId = `lesson_${Math.floor(Math.random() * 10000)}`;

  // Realistic user flow
  group('1. Authentication', () => {
    // Auth check
    let res = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}` },
    });
    check(res, {
      'auth success': (r) => r.status === 200,
      'has user data': (r) => r.body.includes('school_id'),
    });
  });

  sleep(2);

  group('2. Browse Courses', () => {
    let res = http.get(`${BASE_URL}/student/courses`, {
      headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}` },
    });
    check(res, {
      'courses loaded': (r) => r.status === 200,
    });
  });

  sleep(1);

  group('3. Lesson Session', () => {
    // Atomic session creation
    let initRes = http.post(`${BASE_URL}/api/learning/init`,
      JSON.stringify({ lessonId }),
      {
        headers: {
          'Authorization': `Bearer ${STUDENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    check(initRes, {
      'session created': (r) => r.status === 201,
      'has token': (r) => r.body.includes('token'),
    });

    if (initRes.status === 201) {
      const sessionToken = JSON.parse(initRes.body).token;

      // Heartbeats (simulates watching lesson)
      for (let i = 0; i < 5; i++) {
        let hbRes = http.post(`${BASE_URL}/api/learning/heartbeat`,
          JSON.stringify({
            token: sessionToken,
            playbackTime: i * 10,
            nonce: i,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        check(hbRes, {
          'heartbeat ok': (r) => r.status === 200,
        });

        sleep(2);
      }

      // Complete lesson
      let completeRes = http.post(`${BASE_URL}/api/learning/complete`,
        JSON.stringify({ lessonId }),
        {
          headers: {
            'Authorization': `Bearer ${STUDENT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      check(completeRes, {
        'lesson completed': (r) => r.status === 200,
        'xp awarded': (r) => r.body.includes('xp'),
      });
    }
  });

  sleep(1);

  group('4. Quiz Access', () => {
    let quizRes = http.post(`${BASE_URL}/api/student/quiz/fetch`,
      JSON.stringify({ quizId: `quiz_${Math.floor(Math.random() * 5000)}` }),
      {
        headers: {
          'Authorization': `Bearer ${STUDENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    check(quizRes, {
      'quiz loaded': (r) => r.status === 200 || r.status === 403,
      'no answer keys': (r) => !r.body.includes('is_correct'),
    });
  });

  sleep(1);

  group('5. Leaderboard Check', () => {
    let lbRes = http.get(`${BASE_URL}/api/student/leaderboard`, {
      headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}` },
    });

    check(lbRes, {
      'leaderboard loaded': (r) => r.status === 200,
      'has rankings': (r) => r.body.includes('rank'),
    });
  });

  sleep(5);
}

// Attack scenario: Concurrent promo code abuse
export function attackPromoCode() {
  const promoCode = 'RACE_TEST_001';

  const responses = Array(10).fill(null).map(() =>
    http.post(`${BASE_URL}/api/payment/create-order`,
      JSON.stringify({
        plan_id: 'test_plan',
        promo_code_id: promoCode,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );

  const successes = responses.filter(r => r.status === 200).length;
  check(null, {
    'atomic enforcement': () => successes <= 1, // Only 1 should succeed
  });
}

// Attack scenario: Rate limiting
export function attackRateLimitBypass() {
  const responses = [];

  for (let i = 0; i < 50; i++) {
    let res = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}` },
    });
    responses.push(res);

    if (res.status === 429) {
      check(null, {
        'rate limit at ~30 reqs': () => i >= 28 && i <= 32,
      });
      break;
    }
  }
}

// Attack scenario: Cross-school access
export function attackCrossSchoolAccess() {
  const res = http.get(`${BASE_URL}/api/student/lesson/lesson_from_school_b`, {
    headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}` },
  });

  check(res, {
    'cross-school blocked': (r) => r.status === 403 || r.status === 404,
  });
}

// Attack scenario: Session race condition
export function attackSessionRaceCondition() {
  const lessonId = 'lesson_race_test';

  // Send 2 concurrent init requests
  const init1 = http.post(`${BASE_URL}/api/learning/init`,
    JSON.stringify({ lessonId }),
    { headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}`, 'Content-Type': 'application/json' } }
  );

  const init2 = http.post(`${BASE_URL}/api/learning/init`,
    JSON.stringify({ lessonId }),
    { headers: { 'Authorization': `Bearer ${STUDENT_TOKEN}`, 'Content-Type': 'application/json' } }
  );

  if (init1.status === 201 && init2.status === 201) {
    const token1 = JSON.parse(init1.body).token;
    const token2 = JSON.parse(init2.body).token;

    // Try both tokens
    const hb1 = http.post(`${BASE_URL}/api/learning/heartbeat`,
      JSON.stringify({ token: token1, playbackTime: 10, nonce: 1 })
    );

    const hb2 = http.post(`${BASE_URL}/api/learning/heartbeat`,
      JSON.stringify({ token: token2, playbackTime: 10, nonce: 1 })
    );

    check(null, {
      'only one session active': () =>
        (hb1.status === 200 && hb2.status === 403) ||
        (hb1.status === 403 && hb2.status === 200),
    });
  }
}
