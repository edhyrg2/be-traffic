/**
 * Test Script untuk NodeMCU API Endpoints
 * Menguji akses publik ke endpoint NodeMCU tanpa autentikasi
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Function to make HTTP GET request
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: response
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

// Test function
async function testNodeMcuEndpoints() {
    console.log('🧪 Testing NodeMCU API Endpoints...\n');

    const tests = [
        { name: 'Test Endpoint', path: '/api/nodemcu/test' },
        { name: 'Jalur 1 Status', path: '/api/nodemcu/1' },
        { name: 'Jalur 2 Status', path: '/api/nodemcu/2' },
        { name: 'Jalur 3 Status', path: '/api/nodemcu/3' },
        { name: 'Jalur 4 Status', path: '/api/nodemcu/4' },
        { name: 'All Status', path: '/api/nodemcu/status/all' },
        { name: 'Invalid Jalur (should fail)', path: '/api/nodemcu/99' }
    ];

    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name}`);
            console.log(`   URL: ${BASE_URL}${test.path}`);

            const result = await makeRequest(test.path);

            console.log(`   Status: ${result.statusCode}`);
            console.log(`   CORS Headers: ${result.headers['access-control-allow-origin'] || 'Not Set'}`);

            if (result.statusCode === 200) {
                console.log(`   ✅ Success`);
                if (test.path.includes('/nodemcu/') && !test.path.includes('test') && !test.path.includes('all')) {
                    // Validate NodeMCU response format
                    const data = result.data;
                    if (data.jalur_id && data.lampu && typeof data.durasi === 'number') {
                        console.log(`   📊 Data: Jalur ${data.jalur_id}, Lampu: ${data.lampu}, Durasi: ${data.durasi}s`);
                    }
                }
            } else if (result.statusCode === 400 && test.path.includes('99')) {
                console.log(`   ✅ Expected error for invalid jalur`);
            } else {
                console.log(`   ❌ Failed`);
                console.log(`   Response:`, result.data);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('');
    }
}

// Run tests
if (require.main === module) {
    testNodeMcuEndpoints()
        .then(() => {
            console.log('🏁 NodeMCU API Tests Completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test Runner Error:', error);
            process.exit(1);
        });
}

module.exports = { testNodeMcuEndpoints, makeRequest };
