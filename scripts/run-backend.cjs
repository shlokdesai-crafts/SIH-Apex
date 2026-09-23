const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const venvWin = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
const venvUnix = path.join(rootDir, '.venv', 'bin', 'python');

let pythonCmd = 'python';
if (fs.existsSync(venvWin)) {
  pythonCmd = venvWin;
} else if (fs.existsSync(venvUnix)) {
  pythonCmd = venvUnix;
}

console.log(`[CropGuard] Starting FastAPI backend with Python: ${pythonCmd}`);

const child = spawn(
  pythonCmd,
  ['-m', 'uvicorn', 'main:app', '--app-dir', 'backend', '--reload', '--host', '127.0.0.1', '--port', '8000'],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

child.on('error', (err) => {
  console.error('[CropGuard] Failed to start backend server:', err);
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    console.log(`[CropGuard] Backend server exited with code ${code}`);
  } else if (signal !== null) {
    console.log(`[CropGuard] Backend server killed with signal ${signal}`);
  }
});

const cleanup = () => {
  if (child && !child.killed) {
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
      } catch (_) {}
    } else {
      child.kill('SIGTERM');
    }
  }
};

process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });
process.on('exit', cleanup);
