const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create a simple colored PNG
function createPlaceholder(width, height, color, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill with color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Save the file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Create directory if it doesn't exist
if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}

// Create required assets
createPlaceholder(1024, 1024, '#4A90E2', 'assets/icon.png');
createPlaceholder(1024, 1024, '#4A90E2', 'assets/adaptive-icon.png');
createPlaceholder(1242, 2208, '#4A90E2', 'assets/splash.png');
createPlaceholder(48, 48, '#4A90E2', 'assets/favicon.png');

console.log('All placeholder assets created successfully!');
