const fs = require('fs');
const files = ['public/lebra_ai_logo_transparent.png','public/lebra_ai_logo.png','public/lebra_ai_logo_original.png','public/lebra_ai_logo_footer.png','public/libra_ai_logo_exact.png'];
for (const file of files) {
  try {
    const buf = fs.readFileSync(file);
    const ihdr = buf.slice(8, 33);
    const width = ihdr.readUInt32BE(8);
    const height = ihdr.readUInt32BE(12);
    const bitDepth = ihdr.readUInt8(16);
    const colorType = ihdr.readUInt8(17);
    console.log(file, `${width}x${height}`, 'bit', bitDepth, 'colorType', colorType);
  } catch (e) {
    console.log(file, 'ERR', e.message);
  }
}
