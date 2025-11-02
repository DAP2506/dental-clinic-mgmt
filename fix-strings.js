#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .tsx files
const files = glob.sync('src/**/*.tsx');

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix unterminated className strings that end with spaces and have no closing quote
    content = content.replace(/className="([^"]*)\s+$/gm, (match, classes) => {
      modified = true;
      return `className="${classes.trim()}"`;
    });
    
    // Fix other unterminated string patterns
    content = content.replace(/(\w+)="([^"]*)\s+$/gm, (match, attr, value) => {
      modified = true;
      return `${attr}="${value.trim()}"`;
    });
    
    // Fix unterminated JSX text content
    content = content.replace(/>\s*([^<{}\n]+)\s*$/gm, (match, text) => {
      modified = true;
      return `>${text.trim()}`;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('Fix complete!');
