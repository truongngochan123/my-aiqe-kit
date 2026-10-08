'use strict';
// Xác thực Xray. Chuyển từ antigravity-testing-kit-main/scripts/integrations/jira/xray_auth.js (đã đọc toàn bộ 09/10). Khác bản gốc:
//  - KHÔNG in token (bản gốc in 20 ký tự đầu). KHÔNG cache token ra file (.xray_token_cache.json):
//    token chỉ nằm trong bộ nhớ của process đang chạy.
//  - Không tự đọc .env; biến do người cấp qua `node --env-file=<file>`.
//
// Dùng (NGƯỜI chạy):
//   node --env-file=<.env.jira> scripts/jira/xray_auth.js --verify   → chỉ in "hợp lệ" / "không hợp lệ"

const { requireEnv, jiraConfig, httpJson, main } = require('./utils');

const XRAY_CLOUD = 'https://xray.cloud.getxray.app/api/v2';

function platform() {
  const p = (process.env.XRAY_PLATFORM || 'cloud').toLowerCase();
  if (!['cloud', 'server'].includes(p)) throw new Error(`XRAY_PLATFORM phải là cloud hoặc server, nhận "${p}"`);
  return p;
}

// Trả header Authorization cho Xray. Cloud: đổi client id/secret lấy JWT. Server/DC: dùng chung xác thực Jira.
async function xrayHeaders() {
  if (platform() === 'server') return { Authorization: jiraConfig().headers.Authorization };
  requireEnv(['XRAY_CLIENT_ID', 'XRAY_CLIENT_SECRET']);
  const token = await httpJson(`${XRAY_CLOUD}/authenticate`, { method: 'POST', body: { client_id: process.env.XRAY_CLIENT_ID, client_secret: process.env.XRAY_CLIENT_SECRET } });
  if (typeof token !== 'string' || token.length < 20) throw new Error('Xray trả về token không hợp lệ');
  return { Authorization: `Bearer ${token}` };
}

module.exports = { xrayHeaders, platform, XRAY_CLOUD };

if (require.main === module) {
  main(async () => {
    if (!process.argv.includes('--verify')) {
      console.log('Dùng: node --env-file=<.env.jira> scripts/jira/xray_auth.js --verify');
      return;
    }
    await xrayHeaders();
    console.log(`Xray (${platform()}): xác thực hợp lệ. Token không được in và không được lưu ra file.`);
  });
}
