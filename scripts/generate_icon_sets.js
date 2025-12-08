const fs = require('fs');
const path = require('path');

async function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{ recursive: true }); }

async function generate() {
  // dynamic import Jimp for compatibility with different package exports
  const jimpMod = await import('jimp');
  const Jimp = jimpMod.Jimp || jimpMod.default || jimpMod;
  const root = path.join(__dirname, '..');
  const src = path.join(root, 'assets', 'BuddyBoardicon.png');
  if(!fs.existsSync(src)){
    console.error('Source icon not found at', src);
    process.exit(1);
  }
  const img = await Jimp.read(src);

  // iOS AppIcon.appiconset
  const iosOut = path.join(root, 'ios', 'AppIcon.appiconset');
  ensureDir(iosOut);

  const iosImages = [
    { size: 20, scales: [2,3], idiom: 'iphone' },
    { size: 29, scales: [2,3], idiom: 'iphone' },
    { size: 40, scales: [2,3], idiom: 'iphone' },
    { size: 60, scales: [2,3], idiom: 'iphone' },
    { size: 76, scales: [1,2], idiom: 'ipad' },
    { size: 83.5, scales: [2], idiom: 'ipad' },
    { size: 1024, scales: [1], idiom: 'ios-marketing' }
  ];

  const contents = { images: [], info: { version: 1, author: 'xcode' } };

  for(const item of iosImages){
    for(const scale of item.scales){
      const actual = Math.round(item.size * (scale===1?1:scale));
      const filename = `Icon-${item.size}${scale>1?`@${scale}x`:''}.png`.replace('.', '_');
      const outPath = path.join(iosOut, filename);
      // For now copy the 1024 source into the expected filename so native projects have assets.
      fs.copyFileSync(src, outPath);
      contents.images.push({ idiom: item.idiom, size: `${item.size}x${item.size}`, scale: `${scale}x`, filename });
      console.log('Copied iOS', filename);
    }
  }

  // write Contents.json
  fs.writeFileSync(path.join(iosOut, 'Contents.json'), JSON.stringify(contents, null, 2));
  console.log('Wrote iOS Contents.json');

  // Android mipmap
  const androidOutBase = path.join(root, 'android', 'app', 'src', 'main', 'res');
  const densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };
  for(const [folder, size] of Object.entries(densities)){
    const outDir = path.join(androidOutBase, folder);
    ensureDir(outDir);
    const outPath = path.join(outDir, 'ic_launcher.png');
    // copy 1024 source into mipmap folder (Android will scale down as needed)
    fs.copyFileSync(src, outPath);
    console.log('Copied Android', folder, '-> ic_launcher.png');
  }
  // Play store icon
  const playDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-playstore');
  ensureDir(playDir);
  fs.copyFileSync(src, path.join(playDir,'ic_launcher_playstore.png'));
  console.log('Copied Playstore icon (source 1024)');

  console.log('Icon generation complete');
}

generate().catch(e=>{console.error(e); process.exit(1);});
