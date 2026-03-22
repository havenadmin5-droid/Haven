# Haven Asset Generator MCP

An MCP (Model Context Protocol) server for AI-powered asset generation tailored to Haven's "Living Garden" design system. Generate images, stickers, logos, and get design references using AI services.

## Features

### Image Generation
- **generate_image** - Create illustrations, backgrounds, icons using DALL-E or Gemini
- **generate_sticker** - Create cute sticker/emoji-style images (kawaii, pride, minimal styles)
- **generate_logo** - Generate logo concepts with Haven's aesthetic

### Design Tools
- **get_design_references** - Get curated links from Dribbble, Behance, Pinterest, etc.
- **generate_color_palette** - Create harmonious palettes matching Haven's theme
- **generate_gradient** - Generate CSS gradients (linear, radial, conic, mesh)
- **suggest_visual_enhancement** - Get AI suggestions for improving UI/UX

### Code Generation
- **create_animation_config** - Generate Framer Motion configurations
- **generate_svg_pattern** - Create decorative SVG patterns
- **generate_illustration_prompt** - Get detailed prompts for designers or AI tools

## Setup

### 1. Install Dependencies

```bash
cd mcp-asset-generator
npm install
```

### 2. Configure API Keys

```bash
cp .env.example .env
# Edit .env with your API keys
```

Get API keys:
- **OpenAI**: https://platform.openai.com/api-keys (for DALL-E image generation)
- **Gemini**: https://makersuite.google.com/app/apikey (optional)

### 3. Build

```bash
npm run build
```

### 4. Configure Claude Code

Add to your Claude Code MCP settings (`.claude/settings.local.json` or global settings):

```json
{
  "mcpServers": {
    "haven-assets": {
      "command": "node",
      "args": ["/path/to/haven/mcp-asset-generator/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here",
        "GEMINI_API_KEY": "your-key-here"
      }
    }
  }
}
```

Or run with environment variables:

```bash
OPENAI_API_KEY=sk-xxx npm start
```

## Usage Examples

### Generate a Hero Image

```
Use generate_image with:
- prompt: "A diverse group of friends celebrating Pride in a garden"
- style: "haven_garden"
- size: "landscape"
```

### Create Stickers

```
Use generate_sticker with:
- concept: "rainbow butterfly"
- style: "kawaii"
- mood: "happy"
- with_sparkles: true
```

### Get Enhancement Suggestions

```
Use suggest_visual_enhancement with:
- page_or_component: "profile card"
- focus_areas: ["animations", "colors"]
```

### Generate Animation Config

```
Use create_animation_config with:
- animation_type: "entrance"
- element: "card"
- intensity: "playful"
```

## Haven's Living Garden Palette

The MCP is pre-configured with Haven's color palette:

- **Rose**: #FF6B8A
- **Violet**: #7C5CFC
- **Teal**: #00C9A7
- **Amber**: #FFB84D
- **Peach**: #FFAA85
- **Sky**: #4DA6FF
- **Mint**: #38D9A9
- **Lavender**: #B4A7FF
- **Cream (Light BG)**: #FFFBF7
- **Plum (Dark BG)**: #1A1625

## Notes

- Without API keys, the MCP will generate prompts you can use with external tools
- Image generation uses DALL-E 3 which costs $0.04-0.08 per image
- All tools work offline for generating CSS, SVG patterns, and prompts
- For production logos/illustrations, recreate AI output in vector format
