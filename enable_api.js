const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const keyPath = 'lewihouse-7a0d7-firebase-adminsdk-fbsvc-95805aa62a.json';
const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const PROJECT_ID = sa.project_id || 'lewihouse-7a0d7';

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsignedJwt = `${b64Url(header)}.${b64Url(claimSet)}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedJwt);
    sign.end();
    const signature = sign.sign(sa.private_key, 'base64url');
    const assertion = `${unsignedJwt}.${signature}`;

    const postData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertion,
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data).access_token));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function enableApi() {
  const token = await getAccessToken();
  console.log('[*] Attempting to enable Cloud Firestore API for', PROJECT_ID);

  const req = https.request({
    hostname: 'serviceusage.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/services/firestore.googleapis.com:enable`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': 0,
    }
  }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', console.error);
  req.end();
}

enableApi();
