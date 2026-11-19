/**
 * 本地 CORS 代理：把浏览器的请求转发给真正的 AI 服务商，并补上跨域响应头。
 * 用途：多数官方 API 不允许网页直连（浏览器会拦 CORS），走本代理即可。
 *
 * 两种启动方式：
 *   1. 自动：双击「启动网页.bat」——serve.js 检测到 proxy.config.json 时会顺带把代理拉起来
 *   2. 单独：双击「启动代理.bat」，或执行 node proxy.js
 *
 * 页面里 Endpoint 填 http://localhost:8787/v1，API Key 可留空（代理会自己加）。
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const CFG_PATH = path.join(__dirname, 'proxy.config.json');

function loadConfig() {
  if (!fs.existsSync(CFG_PATH)) {
    throw new Error('找不到 proxy.config.json。请复制 proxy.config.example.json 为 proxy.config.json。');
  }
  let cfg = { upstream: '', apiKey: '', port: 8787, allowOrigin: '*' };
  try {
    cfg = Object.assign(cfg, JSON.parse(fs.readFileSync(CFG_PATH, 'utf8')));
  } catch (e) {
    throw new Error('proxy.config.json 解析失败：' + e.message);
  }
  if (!/^http(s)?:\/\//.test(cfg.upstream || '')) {
    throw new Error('proxy.config.json 里的 upstream 必须是完整地址，例如 https://ark.cn-beijing.volces.com/api/v3');
  }
  cfg.upstream = String(cfg.upstream).replace(/\/+$/, '');
  return cfg;
}

function start(cfg, quiet) {
  const client = cfg.upstream.startsWith('https://') ? https : http;

  const server = http.createServer((req, res) => {
    const origin = cfg.allowOrigin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, x-api-key');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    // Chrome 的 Private Network Access 预检
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: { message: 'only POST is proxied' } }));
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      // 页面传的是 /v1/xxx，upstream 里已带版本段（/v1、/api/v3 等），这里只保留后面的路径
      const suffix = (req.url || '').replace(/^\/v1/, '');
      const target = cfg.upstream + suffix;

      const headers = { 'Content-Type': 'application/json' };
      if (cfg.apiKey) headers.Authorization = 'Bearer ' + cfg.apiKey;
      else if (req.headers.authorization) headers.Authorization = req.headers.authorization;

      let parsed;
      try {
        parsed = new URL(target);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: { message: 'bad upstream url: ' + target } }));
      }

      const upstream = client.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers
      }, (upRes) => {
        res.writeHead(upRes.statusCode || 502, {
          'Content-Type': upRes.headers['content-type'] || 'application/json'
        });
        upRes.pipe(res);
      });

      upstream.on('error', (e) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'upstream error: ' + e.message } }));
      });

      if (!quiet) console.log('[proxy] POST ' + target + '  (' + body.length + ' bytes)');
      upstream.end(body);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('');
      console.log('  端口 ' + cfg.port + ' 已被占用——代理可能已经在另一个窗口里跑着。');
      console.log('  如果那个窗口还开着，直接用即可；否则关掉旧窗口再启动。');
      console.log('');
    } else {
      console.error('  代理启动失败：' + err.message);
    }
  });

  server.listen(cfg.port, () => {
    if (!quiet) {
      console.log('');
      console.log('  CORS 代理已启动');
      console.log('  http://localhost:' + cfg.port + '/v1  ->  ' + cfg.upstream);
      if (!cfg.apiKey) {
        console.log('');
        console.log('  注意：apiKey 还是空的。请在页面「设置 → API Key」里粘贴密钥，');
        console.log('        或者把 Key 写进 proxy.config.json 后重启代理。');
      }
      console.log('');
    }
  });

  return server;
}

if (require.main === module) {
  try {
    start(loadConfig(), false);
  } catch (e) {
    console.error('');
    console.error('  ' + e.message);
    console.error('');
    process.exit(1);
  }
}

module.exports = { loadConfig, start };
