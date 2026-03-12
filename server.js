// Render deployment entry point shim
const { spawn } = require('child_process');
const path = require('path');

const server = spawn(process.execPath, [path.join(__dirname, 'backend', 'src', 'server.js')], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('exit', (code) => process.exit(code));
