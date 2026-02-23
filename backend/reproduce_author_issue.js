const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Helper to make HTTP requests
function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Helper for multipart upload
function upload(token, title, filename) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filePath = path.join(__dirname, filename);
    const fileContent = fs.readFileSync(filePath);

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n${title}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nTest Description\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="tags"\r\n\r\n["test"]\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="${filename}"\r\nContent-Type: audio/mpeg\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/podcasts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}

async function runTest() {
  try {
    const timestamp = Date.now();
    const orgName = `PodcastTestOrg_${timestamp}`;

    console.log('--- Starting Podcast Author Reproduction Test (Native) ---');

    // 1. Register TP5
    console.log('\n1. Registering TP5...');
    const tp5Res = await request('POST', '/auth/register', { 'Content-Type': 'application/json' }, JSON.stringify({
      fullName: 'User TP5',
      email: `tp5_${timestamp}@test.com`,
      password: 'password123',
      department: 'Engineering',
      organizationName: orgName
    }));
    const tp5 = tp5Res.data;
    console.log(`   TP5 ID: ${tp5._id}`);

    // 2. Register TP6
    console.log('\n2. Registering TP6...');
    const tp6Res = await request('POST', '/auth/register', { 'Content-Type': 'application/json' }, JSON.stringify({
      fullName: 'User TP6',
      email: `tp6_${timestamp}@test.com`,
      password: 'password123',
      department: 'Engineering',
      organizationName: orgName
    }));
    const tp6 = tp6Res.data;
    console.log(`   TP6 ID: ${tp6._id}`);

    // 3. Login as TP5
    console.log('\n3. Logging in as TP5...');
    const loginRes = await request('POST', '/auth/login', { 'Content-Type': 'application/json' }, JSON.stringify({
      email: `tp5_${timestamp}@test.com`,
      password: 'password123'
    }));
    const token = loginRes.data.token;
    console.log(`   Logged in as: ${loginRes.data.fullName} (${loginRes.data._id})`);

    // 4. Upload Podcast as TP5
    console.log('\n4. Uploading podcast as TP5...');
    const filename = `test_audio_${timestamp}.mp3`;
    fs.writeFileSync(path.join(__dirname, filename), 'dummy audio content');

    const uploadRes = await upload(token, `TP5 Podcast ${timestamp}`, filename);
    fs.unlinkSync(path.join(__dirname, filename));

    if (uploadRes.status !== 201) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadRes.data)}`);
    }
    const podcast = uploadRes.data;
    console.log(`   Podcast uploaded: ${podcast.title}, Author: ${podcast.author.fullName}`);

    if (podcast.author._id !== tp5._id && podcast.author.id !== tp5._id) {
      console.error(`   ❌ MISMATCH: Upload returned author ${podcast.author._id} (Expected ${tp5._id})`);
    } else {
      console.log('   ✅ Upload response author matches TP5');
    }

    // 5. Fetch Podcasts as TP6
    console.log('\n5. Fetching podcasts as TP6...');
    const loginRes6 = await request('POST', '/auth/login', { 'Content-Type': 'application/json' }, JSON.stringify({
      email: `tp6_${timestamp}@test.com`,
      password: 'password123'
    }));

    const feedRes = await request('GET', '/podcasts', { 'Authorization': `Bearer ${loginRes6.data.token}` });
    const feed = feedRes.data;

    const targetPodcast = feed.find(p => p.title === `TP5 Podcast ${timestamp}`);

    if (!targetPodcast) {
      throw new Error('Podcast not found in feed');
    }

    console.log(`   Found podcast in feed. Author: ${targetPodcast.author.fullName}`);

    if (targetPodcast.author.fullName === 'User TP5') {
      console.log('   ✅ CORRECT: Podcast author shows as TP5');
    } else {
      console.error(`   ❌ ERROR: Podcast author shows as ${targetPodcast.author.fullName} (Expected TP5)`);
      process.exit(1);
    }

    console.log('\n--- TEST PASSED: No issue found in backend logic ---');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTest();
