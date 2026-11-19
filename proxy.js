/**
 * 本地 CORS 代理：把浏览器的请求转发给真正的 AI 服务商，并补上跨域响应头。
 * 用途：多数官方 API 不允许网页直连（浏览器会拦 CORS），走本代理即可。
 *
 * 用法：
 *   1. 复制 proxy.config.example.json 为 proxy.config.json
 *   2. 填 upstream（服务商地址，含 /v1）与 apiKey
 *   3. 双击「启动代理.bat」
 *   4. 页面设置里 Endpoint 填 http://localhost:8787/v1，API Key 留空
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const cfgPath = path.join(__dirname, 'proxy.config.json');
let cfg = { upstream: '', apiKey: '', port: 8787, allowOrigin: '*' };
if (fs.existsSync(cfgPath)) {
  try {
    cfg = Object.assign(cfg, JSON.parse(fs.readFileSync(cfgPath, 'utf8')));
  } catch (e) {
    console.error('');
    console.error('  proxy.config.json 解析失败：' + e.message);
    console.error('  请检查逗号、引号是否写对。');
    console.error('');
    process.exit(1);
  }
} else {
  console.error('');
  console.error('  找不到 proxy.config.json');
  console.error('  请复制 proxy.config.example.json 为 proxy.config.json，然后填写 upstream 和 apiKey。');
  console.error('');
  process.exit(1);
}

if (!/^http(s)?:\/\//.test(cfg.upstream || '')) {
  console.error('  proxy.config.json 里的 upstream 必须是完整地址，例如 https://api.deepseek.com/v1');
  process.exit(1);
}

const base = cfg.upstream.replace(/\/+$/, '');
const isHttps = base.startsWith('https://');
const client = isHttps ? https : http;

const server = http.createServer((req, res) => {
  const origin = cfg.allowOrigin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');

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
    // 页面传的是 /v1/xxx，upstream 里已经带了 /v1，这里只保留后面的路径
    const suffix = (req.url || '').replace(/^\/v1/, '');
    const target = base + suffix;

    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers.Authorization = 'Bearer ' + cfg.apiKey;
    else if (req.headers.authorization) headers.Authorization = req.headers.authorization;

    let parsed;
    try { parsed = new URL(target); } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: { message: 'bad upstream url: ' + target } }));
    }

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers
    };

    const upstream = client.request(options, (upRes) => {
      res.writeHead(upRes.statusCode || 502, {
        'Content-Type': upRes.headers['content-type'] || 'application/json'
      });
      upRes.pipe(res);
    });

    upstream.on('error', (e) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'upstream error: ' + e.message } }));
    });

    // 记录请求，方便排查
    console.log('[proxy] POST ' + target + '  (' + body.length + ' bytes)');
    upstream.end(body);
  });
});

server.listen(cfg.port, () => {
  console.log('');
  console.log('  CORS 代理已启动');
  console.log('  http://localhost:' + cfg.port + '/v1  ->  ' + base);
  console.log('');
  console.log('  页面设置里 Endpoint 填 http://localhost:' + cfg.port + '/v1，API Key 留空即可。');
  console.log('  关闭此窗口即停止代理。');
  console.log('');
});
