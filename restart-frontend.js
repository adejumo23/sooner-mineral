const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Restarting frontend to pick up API changes...');

// Kill any existing frontend processes
const killProcesses = () => {
  return new Promise((resolve) => {
    const kill = spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });
    kill.on('close', () => {
      console.log('Killed existing processes');
      resolve();
    });
  });
};

// Touch the main files to force rebuild
const touchFiles = () => {
  const files = [
    'services/apiClient.ts',
    'pages/SectionsPage.tsx',
    'App.tsx'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const time = new Date();
      fs.utimesSync(file, time, time);
      console.log(`Touched ${file}`);
    }
  });
};

// Start the development server
const startDevServer = () => {
  console.log('Starting development server...');
  const dev = spawn('npm', ['run', 'dev'], { 
    shell: true, 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  dev.on('error', (err) => {
    console.error('Failed to start dev server:', err);
  });
  
  return dev;
};

// Main execution
async function main() {
  try {
    await killProcesses();
    touchFiles();
    startDevServer();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();






