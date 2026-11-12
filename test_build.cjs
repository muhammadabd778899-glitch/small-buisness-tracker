const { exec } = require('child_process');
exec('cd D:\\Desktop Data\\Trackers code files\\small business traker\\small-business-manager && npm run build', (error, stdout, stderr) => {
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  if (stderr) {
    console.log('Stderr:', stderr);
    return;
  }
  console.log('Stdout:', stdout);
});