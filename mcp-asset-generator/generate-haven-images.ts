import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const HAVEN_STYLE = `Haven's Living Garden aesthetic: warm cream backgrounds (#FFFBF7), soft organic shapes, rainbow gradient accents using rose (#FF6B8A), violet (#7C5CFC), teal (#00C9A7), amber (#FFB84D). LGBTQIA+ inclusive, diverse representation, welcoming and safe atmosphere. Modern flat vector illustration style with soft shadows and rounded corners.`;

const imagesToGenerate = [
  {
    name: 'hero-community',
    prompt: `Diverse group of LGBTQIA+ individuals connecting and supporting each other in a warm, colorful digital garden setting. People of different skin tones, gender expressions, body types chatting and laughing. Pride rainbow elements naturally integrated. ${HAVEN_STYLE}`,
    size: '1792x1024' as const,
  },
  {
    name: 'safe-space',
    prompt: `Abstract illustration of a glowing protective shield made of flowing rainbow colors surrounding a cozy digital sanctuary. Soft flowers, gentle orbs, and welcoming light. Represents safety and protection. ${HAVEN_STYLE}`,
    size: '1024x1024' as const,
  },
  {
    name: 'bloom-mascot',
    prompt: `Cute rainbow spirit character - a friendly glowing figure with body made of flowing rainbow gradients (pink, orange, teal, blue, purple). Large expressive eyes, warm smile, tiny sparkles floating around. Super cute kawaii-inspired style. ${HAVEN_STYLE}`,
    size: '1024x1024' as const,
  },
];

async function downloadImage(url: string, filepath: string): Promise<void> {
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
      console.error(`  ✗ Error generating ${image.name}:`, error);
    }
    console.log('');
  }

  console.log('Done! Images saved to public/images/generated/');
}

generateImages();
