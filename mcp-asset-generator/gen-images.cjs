const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const https = require('https');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const HAVEN_STYLE = `Haven's Living Garden aesthetic: warm cream backgrounds (#FFFBF7), soft organic shapes, rainbow gradient accents using rose (#FF6B8A), violet (#7C5CFC), teal (#00C9A7), amber (#FFB84D). LGBTQIA+ inclusive, diverse representation, welcoming atmosphere. Modern flat vector illustration style.`;

const imagesToGenerate = [
  {
    name: 'hero-community',
    prompt: `Diverse group of LGBTQIA+ individuals connecting and supporting each other in a warm digital garden. People of different skin tones and gender expressions chatting. Pride rainbow elements. ${HAVEN_STYLE}`,
    size: '1792x1024',
  },
  {
    name: 'safe-space',
    prompt: `Abstract glowing protective shield made of flowing rainbow colors surrounding a cozy sanctuary. Soft flowers, gentle orbs, welcoming light. Safety and protection theme. ${HAVEN_STYLE}`,
    size: '1024x1024',
  },
  {
    name: 'bloom-mascot',
    prompt: `Cute rainbow spirit character - a friendly glowing figure with body of flowing rainbow gradients. Large expressive eyes, warm smile, sparkles. Kawaii-inspired. ${HAVEN_STYLE}`,
    size: '1024x1024',
  },
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateImages() {
  const outputDir = path.join(__dirname, '../public/images/generated');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Starting Haven AI image generation...\n');
  console.log('API Key found:', !!process.env.OPENAI_API_KEY);

  for (const image of imagesToGenerate) {
    console.log(`Generating: ${image.name}...`);
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: image.prompt,
        n: 1,
        size: image.size,
        quality: 'standard',
        style: 'vivid',
      });

      const imageUrl = response.data[0]?.url;
      if (imageUrl) {
        const filepath = path.join(outputDir, `${image.name}.png`);
        await downloadImage(imageUrl, filepath);
        console.log(`  ✓ Saved to: ${filepath}`);
      }
    } catch (error) {
      console.error(`  ✗ Error:`, error.message || error);
    }
    console.log('');
  }

  console.log('Done!');
}

generateImages();
