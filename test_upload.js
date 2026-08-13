const http = require('http');
const fs = require('fs');

function login() {
  const data = JSON.stringify({ email: 'superadmin@test.com', password: 'Password123!' });
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function upload(token, fileContent, description) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    // Construct manual multipart body
    let body = '';
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="category"\r\n\r\n';
    body += 'business_assets\r\n';
    
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="description"\r\n\r\n';
    body += `${description}\r\n`;
    
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n';
    body += 'Content-Type: text/plain\r\n\r\n';
    body += `${fileContent}\r\n`;
    body += `--${boundary}--\r\n`;

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/uploads',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log('Logging in...');
    const loginRes = await login();
    const token = loginRes.accessToken;
    console.log('Logged in successfully. Uploading file...');
    
    const desc = 'Company logo for our homepage';
    const uploadRes = await upload(token, 'Hello upload text content', desc);
    
    console.log('Upload status:', uploadRes.status);
    console.log('Upload body:', JSON.stringify(uploadRes.body, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
