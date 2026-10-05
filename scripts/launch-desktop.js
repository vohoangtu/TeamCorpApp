import { spawn } from 'node:child_process';
import http from 'node:http';

const URL = 'http://localhost:5173';

function checkReady() {
  return new Promise((resolve) => {
    http.get(URL, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    const isReady = await checkReady();
    if (isReady) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  console.log('[Desktop Launcher] Waiting for Vite dashboard...');
  const ready = await waitForServer();
  if (!ready) {
    console.error('[Desktop Launcher] Server timeout.');
    return;
  }

  console.log('[Desktop Launcher] Launching Windows 11 Native App Window...');

  // Launch standalone app window using Edge/WebView2 App mode on Windows 11
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  
  const args = [
    `--app=${URL}`,
    '--window-size=1360,880',
    '--window-position=center',
    '--enable-features=MicaTitlebar',
    '--no-first-run',
    '--no-default-browser-check'
  ];

  spawn(edgePath, args, {
    detached: true,
    stdio: 'ignore'
  }).unref();

  console.log('✨ [WinDev Hub] Windows 11 Desktop Window opened successfully!');
}

main();
