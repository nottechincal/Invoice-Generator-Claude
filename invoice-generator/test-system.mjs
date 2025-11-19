#!/usr/bin/env node

/**
 * Automated System Test for Invoice Generator
 * Run this after deployment to verify all endpoints work
 * Usage: node test-system.mjs <your-app-url>
 */

const APP_URL = process.argv[2] || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  testsPassed++;
  log(`✓ ${message}`, 'green');
}

function fail(message, error) {
  testsFailed++;
  log(`✗ ${message}`, 'red');
  if (error) log(`  Error: ${error}`, 'yellow');
}

function info(message) {
  log(message, 'blue');
}

async function testEndpoint(name, path, options = {}) {
  try {
    const response = await fetch(`${APP_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const expectedStatus = options.expectedStatus || 200;

    if (response.status === expectedStatus) {
      success(`${name} - Status ${response.status}`);
      return response;
    } else {
      fail(`${name} - Expected ${expectedStatus}, got ${response.status}`);
      return null;
    }
  } catch (error) {
    fail(`${name} - Request failed`, error.message);
    return null;
  }
}

async function runTests() {
  info(`\n🧪 Testing Invoice Generator System`);
  info(`📍 URL: ${APP_URL}\n`);

  // Test 1: Homepage loads
  info('Testing Basic Pages...');
  await testEndpoint('Homepage', '/');
  await testEndpoint('Login Page', '/auth/login');
  await testEndpoint('Signup Page', '/auth/signup');

  // Test 2: API Routes exist (should return 401 without auth)
  info('\nTesting API Routes (Unauthenticated)...');
  await testEndpoint('Invoices API', '/api/invoices', { expectedStatus: 401 });
  await testEndpoint('Customers API', '/api/customers', { expectedStatus: 401 });
  await testEndpoint('Products API', '/api/products', { expectedStatus: 401 });
  await testEndpoint('Payments API', '/api/payments', { expectedStatus: 401 });
  await testEndpoint('Analytics API', '/api/analytics/overview', { expectedStatus: 401 });

  // Test 3: New features exist
  info('\nTesting New Feature Routes...');
  await testEndpoint('Quotes API', '/api/quotes', { expectedStatus: 401 });
  await testEndpoint('Recurring Invoices API', '/api/recurring-invoices', { expectedStatus: 401 });
  await testEndpoint('Expenses API', '/api/expenses', { expectedStatus: 401 });
  await testEndpoint('Time Entries API', '/api/time-entries', { expectedStatus: 401 });
  await testEndpoint('Currencies API', '/api/currencies');

  // Test 4: Dashboard routes (should redirect to login)
  info('\nTesting Dashboard Routes...');
  const dashResponse = await testEndpoint('Dashboard', '/dashboard', {
    expectedStatus: 200,
    redirect: 'follow'
  });

  // Summary
  info('\n' + '='.repeat(50));
  log(`\n✓ Passed: ${testsPassed}`, 'green');
  if (testsFailed > 0) {
    log(`✗ Failed: ${testsFailed}`, 'red');
  }

  const total = testsPassed + testsFailed;
  const percentage = ((testsPassed / total) * 100).toFixed(1);

  if (testsFailed === 0) {
    log(`\n🎉 All tests passed! System is working correctly.`, 'green');
  } else {
    log(`\n⚠️  System test completed: ${percentage}% pass rate`, 'yellow');
  }

  log('\n' + '='.repeat(50) + '\n', 'blue');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  process.exit(1);
});
