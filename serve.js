/**
 * 本地静态服务器：让页面跑在 http://localhost 上。
 * 原因：浏览器的语音识别（Web Speech API）只在 https 或 localhost 下可用，
 * 直接双击 index.html（file:///…）时会被拒绝启动。
 *
 * 用法：双击「启动网页.bat」，或在本目录执行 node serve.js
 * 若同目录存在 proxy.config.json，会顺带把 CORS 代理一起拉起来（一个窗口搞定页面 + 代理）。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function handler(req, res) {
  let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(ROOT, '.' + pathname);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('not found: ' + pathname);
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(buf);
  });
}

function openBrowser(url) {
  if (process.platform === 'win32') exec('start "" "' + url + '"');
  else if (process.platform === 'darwin') exec('open "' + url + '"');
  else exec('xdg-open "' + url + '"');
}

function startProxyQuietly() {
  try {
    const proxy = require('./proxy');
    const cfg = proxy.loadConfig();
    proxy.start(cfg, true);
    console.log('  AI 代理也已启动（同一个窗口）：');
    console.log('  http://localhost:' + cfg.port + '/v1  ->  ' + cfg.upstream);
    if (!cfg.apiKey) {
      console.log('  ⚠ proxy.config.json 里 apiKey 为空：请在页面「设置 → API Key」里粘贴密钥，');
      console.log('    或把 Key 写进 proxy.config.json 后重新启动本窗口。');
    }
    console.log('');
  } catch (e) {
    console.log('  AI 代理未启动：' + e.message);
    console.log('  （页面仍可用，只是 AI 评分只能走本地规则）');
    console.log('');
  }
}

function listen(port, attempt) {
  const server = http.createServer(handler);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 12) {
      listen(port + 1, attempt + 1);
    } else {
      console.error('启动失败：' + err.message);
      process.exit(1);
    }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = 'http://localhost:' + port + '/';
    console.log('');
    console.log('  即兴表达训练场已启动');
    console.log('  ' + url);
    console.log('');
    console.log('  语音识别在这个地址下才可用。关闭此窗口即停止服务。');
    console.log('');
    startProxyQuietly();
    if (!process.argv.includes('--no-open')) openBrowser(url);
  });
}

listen(START_PORT, 0);
