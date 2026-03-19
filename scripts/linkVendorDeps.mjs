import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const vendorPackages = [
  ['classnames', 'classnames'],
  ['sass', 'sass-stub'],
  ['sass-embedded', 'sass-embedded'],
];

const ensureLink = ([packageName, vendorDirName]) => {
  const targetDir = path.join(rootDir, 'node_modules', packageName);
  if (fs.existsSync(targetDir)) {
    return;
  }

  const sourceDir = path.join(rootDir, 'vendor', vendorDirName);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`[vendor-links] Missing vendor package '${packageName}' at ${sourceDir}`);
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });

  try {
    fs.symlinkSync(sourceDir, targetDir, 'dir');
    console.log(`[vendor-links] Linked ${packageName} -> ${path.relative(rootDir, sourceDir)}`);
  } catch (error) {
    if ((error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') || fs.existsSync(targetDir)) {
      return;
    }
    throw error;
  }
};

vendorPackages.forEach(ensureLink);
