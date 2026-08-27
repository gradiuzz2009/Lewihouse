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
      scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform',
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

function requestJson(url, options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    req.end();
  });
}

async function main() {
  try {
    const token = await getAccessToken();
    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

    console.log('[*] Creating new ruleset for project:', PROJECT_ID);
    const rulesetPayload = {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent,
          }
        ]
      }
    };

    const rulesetRes = await requestJson(`https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }, rulesetPayload);

    if (rulesetRes.status !== 200) {
      console.error('[!] Failed creating ruleset:', rulesetRes.data);
      return;
    }

    const rulesetName = rulesetRes.data.name;
    console.log('  [✓] Ruleset created:', rulesetName);

    console.log('[*] Releasing ruleset to cloud.firestore...');
    const releasePayload = {
      name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
      rulesetName: rulesetName,
    };

    const releaseRes = await requestJson(`https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }, { release: releasePayload });

    if (releaseRes.status >= 200 && releaseRes.status < 300) {
      console.log('  [✓] Successfully published firestore.rules to project', PROJECT_ID);
    } else {
      console.log('Release response:', releaseRes);
    }

    // Deploy Storage Rules
    if (fs.existsSync('storage.rules')) {
      const storageContent = fs.readFileSync('storage.rules', 'utf8');
      console.log('[*] Creating storage ruleset for project:', PROJECT_ID);
      const storageRulesetRes = await requestJson(`https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }, {
        source: {
          files: [{ name: 'storage.rules', content: storageContent }]
        }
      });

      if (storageRulesetRes.status === 200) {
        const storageRulesetName = storageRulesetRes.data.name;
        console.log('  [✓] Storage ruleset created:', storageRulesetName);

        const buckets = [`${PROJECT_ID}.appspot.com`, `${PROJECT_ID}.firebasestorage.app`];
        for (const bucket of buckets) {
          try {
            const bucketRelease = await requestJson(`https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/firebase.storage/${bucket}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            }, { release: { name: `projects/${PROJECT_ID}/releases/firebase.storage/${bucket}`, rulesetName: storageRulesetName } });
            if (bucketRelease.status >= 200 && bucketRelease.status < 300) {
              console.log(`  [✓] Successfully published storage.rules to bucket: ${bucket}`);
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error('[!] Deploy rules error:', err);
  }
}

main();
