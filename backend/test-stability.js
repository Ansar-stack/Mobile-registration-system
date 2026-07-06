/**
 * Backend Stability Test Script
 * Run this to verify the fixes are working properly
 * 
 * Usage: node test-stability.js
 */

import http from 'http';

const BASE_URL = 'http://localhost:4000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(options) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message
      });
    });
    
    req.end();
  });
}

async function testHealthEndpoint() {
  log(colors.blue, '\n1. Testing /health endpoint...');
  const response = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/health',
    method: 'GET'
  });
  
  if (response.statusCode === 200) {
    log(colors.green, '✓ Health check passed');
    console.log('  Response:', response.body.substring(0, 100));
  } else {
    log(colors.red, '✗ Health check failed');
    console.log('  Status:', response.statusCode);
  }
  return response.statusCode === 200;
}

async function testCORSRejection() {
  log(colors.blue, '\n2. Testing CORS rejection (should NOT crash server)...');
  const response = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/health',
    method: 'GET',
    headers: {
      'Origin': 'http://unauthorized-domain.com'
    }
  });
  
  // Should return 403 or handle gracefully, not crash
  if (response.statusCode === 403 || response.statusCode === 404) {
    log(colors.green, '✓ CORS rejection handled gracefully');
    console.log('  Status:', response.statusCode);
  } else if (response.statusCode === 200) {
    log(colors.yellow, '⚠ CORS allowed request (check if this origin should be allowed)');
  } else {
    log(colors.red, '✗ Unexpected response');
    console.log('  Status:', response.statusCode);
  }
}

async function testInvalidEndpoint() {
  log(colors.blue, '\n3. Testing 404 handling...');
  const response = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/nonexistent-endpoint-12345',
    method: 'GET'
  });
  
  if (response.statusCode === 404) {
    log(colors.green, '✓ 404 handling works');
  } else {
    log(colors.red, '✗ 404 handling failed');
    console.log('  Status:', response.statusCode);
  }
}

async function testServerStillRunning() {
  log(colors.blue, '\n4. Testing server is still running after previous tests...');
  const response = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/health',
    method: 'GET'
  });
  
  if (response.statusCode === 200) {
    log(colors.green, '✓ Server still running (no crashes!)');
  } else {
    log(colors.red, '✗ Server appears to be down');
  }
  return response.statusCode === 200;
}

async function testConcurrentRequests() {
  log(colors.blue, '\n5. Testing concurrent requests (load test)...');
  
  const requests = Array(10).fill().map((_, i) => 
    makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    })
  );
  
  const responses = await Promise.all(requests);
  const successful = responses.filter(r => r.statusCode === 200).length;
  
  if (successful === 10) {
    log(colors.green, `✓ All 10 concurrent requests succeeded`);
  } else {
    log(colors.yellow, `⚠ ${successful}/10 requests succeeded`);
  }
}

async function runTests() {
  log(colors.blue, '='.repeat(60));
  log(colors.blue, 'Backend Stability Test Suite');
  log(colors.blue, '='.repeat(60));
  
  try {
    await testHealthEndpoint();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testCORSRejection();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testInvalidEndpoint();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testServerStillRunning();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testConcurrentRequests();
    
    log(colors.blue, '\n' + '='.repeat(60));
    log(colors.green, 'Tests completed! Check above for any failures.');
    log(colors.blue, '='.repeat(60));
    
    log(colors.yellow, '\nNext steps:');
    console.log('  1. Check logs/error.log for any errors logged');
    console.log('  2. Verify server is still running (should be!)');
    console.log('  3. Deploy with confidence knowing crashes are prevented');
    
  } catch (error) {
    log(colors.red, `\nTest suite error: ${error.message}`);
  }
}

// Check if server is running first
log(colors.yellow, 'Checking if server is running on port 4000...');
makeRequest({
  hostname: 'localhost',
  port: 4000,
  path: '/health',
  method: 'GET'
}).then(response => {
  if (response.error) {
    log(colors.red, '\n✗ Server is not running!');
    log(colors.yellow, '\nPlease start the server first:');
    console.log('  npm run dev    (development)');
    console.log('  npm start      (production)');
    process.exit(1);
  } else {
    runTests();
  }
});
