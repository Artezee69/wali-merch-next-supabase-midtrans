const fs = require('fs');
const path = require('path');

// Pattern-based replacements for proper light/dark mode
// Base = light mode, dark: = dark mode override
const replacements = [
  // Backgrounds: dark bases -> light bases with dark variants
  { find: 'bg-gray-900 dark:bg-gray-950', replace: 'bg-white/5 dark:bg-gray-900/20' }, // Card backgrounds
  { find: 'bg-[#0b0b0b]', replace: 'bg-black/10 dark:bg-white/5' },
  { find: 'bg-black/40', replace: 'bg-white/10 dark:bg-black/40' },
  { find: 'bg-black/60', replace: 'bg-white/15 dark:bg-black/60' },
  { find: 'bg-black/70', replace: 'bg-white/20 dark:bg-black/70' },
  { find: 'bg-white/[0.04]', replace: 'bg-black/[0.04] dark:bg-white/[0.04]' },
  { find: 'bg-white/[0.02]', replace: 'bg-black/[0.02] dark:bg-white/[0.02]' },
  { find: 'bg-white/[0.05]', replace: 'bg-black/[0.05] dark:bg-white/[0.05]' },

  // Text colors: white-based -> gray-based with dark variants
  { find: 'text-white/85', replace: 'text-gray-700/85 dark:text-white/85' },
  { find: 'text-white/70', replace: 'text-gray-700/70 dark:text-white/70' },
  { find: 'text-white/60', replace: 'text-gray-600/60 dark:text-white/60' },
  { find: 'text-white/55', replace: 'text-gray-500/55 dark:text-white/55' },
  { find: 'text-white/35', replace: 'text-gray-400/35 dark:text-white/35' },
  { find: 'text-white/90', replace: 'text-gray-800/90 dark:text-white/90' },
  { find: 'text-white/75', replace: 'text-gray-700/75 dark:text-white/75' },
  { find: 'text-white', replace: 'text-gray-900 dark:text-white' },
  { find: 'text-red-300', replace: 'text-red-400 dark:text-red-200' },

  // Borders
  { find: 'border-white/10', replace: 'border-black/10 dark:border-white/10' },
  { find: 'border-white/15', replace: 'border-black/15 dark:border-white/15' },
  { find: 'border-white/20', replace: 'border-black/20 dark:border-white/20' },
  { find: 'border-white/30', replace: 'border-black/30 dark:border-white/30' },
  { find: 'border-white/5', replace: 'border-black/5 dark:border-white/5' },

  // Gradients from black
  { find: 'from-black/85', replace: 'from-black/85 dark:from-gray-950/85' },
  { find: 'from-black/30', replace: 'from-black/30 dark:via-gray-900/30' },
  { find: 'from-black/80', replace: 'from-black/80 dark:from-gray-950/80' },
  { find: 'from-[#0b0b0b]', replace: 'from-black dark:from-gray-950' },

  // Accent handling - keep accent as green (#d7ff53) but ensure visibility
  { find: 'text-accent', replace: 'text-[#d7ff53]' }, // Keep accent color
  { find: 'bg-accent', replace: 'bg-[#d7ff53]' },
];

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  replacements.forEach(re => {
    if (content.includes(re.find)) {
      content = content.replace(new RegExp(re.find, 'g'), re.replace);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated: ${filepath}`);
  }
}

// Process all TSX files
function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('Starting comprehensive theme fix...');
walk(path.join(__dirname, '.'));
console.log('Done!');