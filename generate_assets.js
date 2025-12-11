// generate_assets.js
// Generates a 1024x1024 app icon and a 1242x2436 splash image using Jimp
const Jimp = require('jimp');
const path = require('path');

async function generate() {
  const outDir = path.join(__dirname, 'assets');
  try {
    // create icon 1024x1024
    const icon = new Jimp(1024, 1024, '#0066FF');
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
    const text = 'BB';
    const textW = Jimp.measureText(font, text);
    const textH = Jimp.measureTextHeight(font, text, 1024);
    icon.print(font, (1024 - textW) / 2, (1024 - textH) / 2, text);
    await icon.writeAsync(path.join(outDir, 'icon.png'));
    console.log('Wrote', path.join(outDir, 'icon.png'));

    // create splash 1242x2436 (portrait)
    const splashW = 1242;
    const splashH = 2436;
    const splash = new Jimp(splashW, splashH, '#ffffff');
    const logo = new Jimp(800, 800, '#0066FF');
    const font2 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const logoText = 'BuddyBoard';
    const logoTextW = Jimp.measureText(font2, logoText);
    const logoTextH = Jimp.measureTextHeight(font2, logoText, 800);
    logo.print(font2, (800 - logoTextW) / 2, (800 - logoTextH) / 2, logoText);

    // composite logo centered vertically a bit higher
    const x = Math.floor((splashW - 800) / 2);
    const y = Math.floor((splashH - 800) / 3);
    splash.composite(logo, x, y);

    await splash.writeAsync(path.join(outDir, 'splash-icon.png'));
    console.log('Wrote', path.join(outDir, 'splash-icon.png'));

    console.log('Asset generation complete.');
  } catch (e) {
    console.error('Asset generation failed:', e);
    process.exit(1);
  }
}

generate();
