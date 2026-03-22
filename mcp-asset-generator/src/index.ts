#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs/promises";
import * as path from "path";

// Haven's Living Garden color palette
const HAVEN_COLORS = {
  rose: "#FF6B8A",
  violet: "#7C5CFC",
  teal: "#00C9A7",
  amber: "#FFB84D",
  peach: "#FFAA85",
  sky: "#4DA6FF",
  mint: "#38D9A9",
  lavender: "#B4A7FF",
  cream: "#FFFBF7",
  plum: "#1A1625",
  rainbow: ["#FF6B8A", "#FFB84D", "#00C9A7", "#4DA6FF", "#7C5CFC", "#B4A7FF"],
};

// Design reference sources
const DESIGN_REFERENCES = {
  dribbble: "https://dribbble.com/search/",
  behance: "https://www.behance.net/search/projects?search=",
  pinterest: "https://pinterest.com/search/pins/?q=",
  awwwards: "https://www.awwwards.com/websites/",
  mobbin: "https://mobbin.com/search?q=",
  collectui: "https://collectui.com/designs/",
};

// Sticker styles for Haven
const STICKER_STYLES = [
  "kawaii cute style with soft pastels",
  "pride rainbow gradient",
  "minimalist line art with gradient fill",
  "soft watercolor with sparkles",
  "pixel art retro style",
  "hand-drawn doodle style",
  "glassmorphism with blur",
  "3D rendered cute character",
];

// Initialize AI clients
let openai: OpenAI | null = null;
let gemini: GoogleGenerativeAI | null = null;

function initializeClients() {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
}

// Tool definitions
const tools: Tool[] = [
  {
    name: "generate_image",
    description:
      "Generate an image using AI (DALL-E or Gemini) with Haven's Living Garden aesthetic. Perfect for illustrations, backgrounds, icons, and promotional materials.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description of the image to generate",
        },
        style: {
          type: "string",
          enum: [
            "haven_garden",
            "pride_vibrant",
            "soft_pastel",
            "minimalist",
            "illustration",
            "3d_render",
            "watercolor",
            "custom",
          ],
          description: "Visual style for the image",
        },
        size: {
          type: "string",
          enum: ["square", "portrait", "landscape", "banner"],
          description: "Image dimensions",
        },
        provider: {
          type: "string",
          enum: ["openai", "gemini"],
          description: "AI provider to use (default: openai)",
        },
        save_to: {
          type: "string",
          description: "Optional path to save the image (relative to public/)",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_sticker",
    description:
      "Generate a sticker/emoji-style image for Haven. Creates cute, colorful stickers perfect for reactions, badges, and decorative elements.",
    inputSchema: {
      type: "object",
      properties: {
        concept: {
          type: "string",
          description: "What the sticker represents (e.g., 'heart', 'rainbow butterfly', 'celebration')",
        },
        style: {
          type: "string",
          enum: [
            "kawaii",
            "pride",
            "minimal",
            "watercolor",
            "pixel",
            "doodle",
            "glass",
            "3d_cute",
          ],
          description: "Sticker visual style",
        },
        mood: {
          type: "string",
          enum: ["happy", "love", "celebrate", "support", "peaceful", "playful"],
          description: "Emotional mood of the sticker",
        },
        with_sparkles: {
          type: "boolean",
          description: "Add sparkle effects around the sticker",
        },
        transparent_bg: {
          type: "boolean",
          description: "Generate with transparent background",
        },
      },
      required: ["concept"],
    },
  },
  {
    name: "generate_logo",
    description:
      "Generate logo concepts and variations for Haven features, communities, or events.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name or concept for the logo",
        },
        type: {
          type: "string",
          enum: ["icon", "wordmark", "combination", "mascot", "abstract"],
          description: "Type of logo to generate",
        },
        colors: {
          type: "array",
          items: { type: "string" },
          description: "Colors to use (or 'rainbow' for pride gradient)",
        },
        include_bloom: {
          type: "boolean",
          description: "Include Haven's Bloom mascot in the design",
        },
        style: {
          type: "string",
          enum: ["modern", "playful", "elegant", "organic", "geometric"],
          description: "Overall design style",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_design_references",
    description:
      "Get curated design references and inspiration from top design platforms for specific UI/UX patterns, visual styles, or feature implementations.",
    inputSchema: {
      type: "object",
      properties: {
        search_query: {
          type: "string",
          description: "What to search for (e.g., 'social app feed', 'chat ui dark mode')",
        },
        platforms: {
          type: "array",
          items: {
            type: "string",
            enum: ["dribbble", "behance", "pinterest", "awwwards", "mobbin", "collectui"],
          },
          description: "Design platforms to search",
        },
        category: {
          type: "string",
          enum: ["ui_pattern", "color_palette", "typography", "illustration", "animation", "branding"],
          description: "Category of design reference",
        },
        for_feature: {
          type: "string",
          description: "Haven feature this reference is for (e.g., 'feed', 'directory', 'chat')",
        },
      },
      required: ["search_query"],
    },
  },
  {
    name: "generate_color_palette",
    description:
      "Generate harmonious color palettes that complement Haven's Living Garden theme.",
    inputSchema: {
      type: "object",
      properties: {
        base_color: {
          type: "string",
          description: "Starting color (hex or name)",
        },
        mood: {
          type: "string",
          enum: ["warm", "cool", "vibrant", "soft", "dark", "light", "rainbow"],
          description: "Overall mood of the palette",
        },
        count: {
          type: "number",
          description: "Number of colors to generate (3-8)",
        },
        include_haven_colors: {
          type: "boolean",
          description: "Include Haven's existing accent colors",
        },
        for_dark_mode: {
          type: "boolean",
          description: "Optimize palette for dark mode",
        },
      },
      required: ["mood"],
    },
  },
  {
    name: "generate_gradient",
    description:
      "Generate beautiful CSS gradients for Haven's UI elements.",
    inputSchema: {
      type: "object",
      properties: {
        style: {
          type: "string",
          enum: ["linear", "radial", "conic", "mesh"],
          description: "Type of gradient",
        },
        colors: {
          type: "array",
          items: { type: "string" },
          description: "Colors for the gradient (or 'pride' for rainbow)",
        },
        direction: {
          type: "string",
          description: "Direction for linear gradients (e.g., 'to right', '45deg')",
        },
        animated: {
          type: "boolean",
          description: "Generate animated gradient CSS",
        },
      },
      required: ["style"],
    },
  },
  {
    name: "suggest_visual_enhancement",
    description:
      "Get AI-powered suggestions for enhancing Haven's visual design for specific pages or components.",
    inputSchema: {
      type: "object",
      properties: {
        page_or_component: {
          type: "string",
          description: "Page or component to enhance (e.g., 'landing page', 'profile card')",
        },
        current_issues: {
          type: "string",
          description: "What feels lacking or could be improved",
        },
        inspiration_style: {
          type: "string",
          description: "Reference style or app to draw inspiration from",
        },
        focus_areas: {
          type: "array",
          items: {
            type: "string",
            enum: ["colors", "animations", "icons", "typography", "spacing", "imagery", "interactivity"],
          },
          description: "Areas to focus enhancement on",
        },
      },
      required: ["page_or_component"],
    },
  },
  {
    name: "create_animation_config",
    description:
      "Generate Framer Motion animation configurations for Haven components.",
    inputSchema: {
      type: "object",
      properties: {
        animation_type: {
          type: "string",
          enum: [
            "entrance",
            "exit",
            "hover",
            "tap",
            "scroll",
            "stagger",
            "morph",
            "floating",
            "celebration",
          ],
          description: "Type of animation to create",
        },
        element: {
          type: "string",
          description: "Element being animated (e.g., 'card', 'button', 'list item')",
        },
        intensity: {
          type: "string",
          enum: ["subtle", "moderate", "playful", "dramatic"],
          description: "Animation intensity level",
        },
        duration: {
          type: "number",
          description: "Animation duration in seconds",
        },
      },
      required: ["animation_type", "element"],
    },
  },
  {
    name: "generate_svg_pattern",
    description:
      "Generate decorative SVG patterns for backgrounds and visual effects.",
    inputSchema: {
      type: "object",
      properties: {
        pattern_type: {
          type: "string",
          enum: [
            "dots",
            "waves",
            "flowers",
            "hearts",
            "stars",
            "geometric",
            "organic",
            "confetti",
          ],
          description: "Type of pattern to generate",
        },
        colors: {
          type: "array",
          items: { type: "string" },
          description: "Colors for the pattern",
        },
        density: {
          type: "string",
          enum: ["sparse", "medium", "dense"],
          description: "How densely packed the pattern elements are",
        },
        animated: {
          type: "boolean",
          description: "Include CSS animation",
        },
      },
      required: ["pattern_type"],
    },
  },
  {
    name: "generate_illustration_prompt",
    description:
      "Generate detailed prompts for creating Haven-themed illustrations, useful for Midjourney, DALL-E, or working with designers.",
    inputSchema: {
      type: "object",
      properties: {
        scene: {
          type: "string",
          description: "What scene or concept to illustrate",
        },
        include_bloom: {
          type: "boolean",
          description: "Include Bloom mascot in the illustration",
        },
        style: {
          type: "string",
          enum: [
            "flat_vector",
            "isometric",
            "hand_drawn",
            "3d_render",
            "watercolor",
            "geometric",
          ],
          description: "Illustration style",
        },
        mood: {
          type: "string",
          enum: ["joyful", "peaceful", "empowering", "cozy", "celebratory", "supportive"],
          description: "Emotional mood of the illustration",
        },
        for_feature: {
          type: "string",
          description: "What Haven feature this is for",
        },
      },
      required: ["scene"],
    },
  },
];

// Tool handlers
async function handleGenerateImage(args: {
  prompt: string;
  style?: string;
  size?: string;
  provider?: string;
  save_to?: string;
}) {
  const stylePrompts: Record<string, string> = {
    haven_garden:
      "Living Garden aesthetic, warm cream and soft pastels, organic flowing shapes, rainbow accents, inviting and inclusive atmosphere",
    pride_vibrant:
      "vibrant pride colors, rainbow gradients, celebratory, bold and confident, LGBTQIA+ inclusive",
    soft_pastel:
      "soft pastel colors, gentle gradients, dreamy and ethereal, calming atmosphere",
    minimalist:
      "clean minimalist design, simple shapes, plenty of whitespace, modern and elegant",
    illustration:
      "beautiful digital illustration, warm and friendly, inclusive representation",
    "3d_render":
      "3D rendered, soft lighting, rounded friendly shapes, vibrant colors",
    watercolor:
      "watercolor texture, soft edges, flowing colors, artistic and organic",
  };

  const sizeMap: Record<string, string> = {
    square: "1024x1024",
    portrait: "1024x1792",
    landscape: "1792x1024",
    banner: "1792x1024",
  };

  const styleAddition = stylePrompts[args.style || "haven_garden"] || args.style || stylePrompts.haven_garden;
  const fullPrompt = `${args.prompt}. Style: ${styleAddition}. Use Haven's warm, inclusive, garden-inspired aesthetic with colors like rose (#FF6B8A), violet (#7C5CFC), teal (#00C9A7), amber (#FFB84D).`;

  if (args.provider === "gemini" && gemini) {
    const model = gemini.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(
      `Create a detailed image description for: ${fullPrompt}`
    );
    return {
      type: "gemini_description",
      description: result.response.text(),
      note: "Gemini provided a detailed description. Use this with an image generation service or designer.",
    };
  }

  if (openai) {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: (sizeMap[args.size || "square"] as "1024x1024" | "1024x1792" | "1792x1024") || "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    return {
      type: "openai_image",
      url: imageUrl,
      revised_prompt: revisedPrompt,
      save_path: args.save_to,
      note: args.save_to
        ? `Image generated. Save to: public/${args.save_to}`
        : "Image generated successfully. Copy URL or save manually.",
    };
  }

  return {
    type: "prompt_only",
    prompt: fullPrompt,
    note: "No AI provider configured. Use this prompt with DALL-E, Midjourney, or your preferred image generator.",
  };
}

async function handleGenerateSticker(args: {
  concept: string;
  style?: string;
  mood?: string;
  with_sparkles?: boolean;
  transparent_bg?: boolean;
}) {
  const styleDescriptions: Record<string, string> = {
    kawaii: "kawaii cute Japanese style with big eyes, soft pastels, round shapes, adorable expression",
    pride: "vibrant pride rainbow gradient colors, bold and celebratory, LGBTQIA+ themed",
    minimal: "minimalist line art with subtle gradient fill, clean and modern",
    watercolor: "soft watercolor texture with blended colors, artistic and delicate",
    pixel: "retro pixel art style, 32-bit aesthetic, nostalgic and playful",
    doodle: "hand-drawn doodle style, sketchy lines, casual and friendly",
    glass: "glassmorphism effect, frosted glass with blur, modern UI aesthetic",
    "3d_cute": "3D rendered cute character, soft lighting, rounded shapes, Pixar-like quality",
  };

  const moodDescriptions: Record<string, string> = {
    happy: "joyful expression, bright colors, uplifting energy",
    love: "hearts, pink tones, warm and affectionate",
    celebrate: "confetti, party elements, festive and exciting",
    support: "warm embrace feeling, comforting, safe",
    peaceful: "calm and serene, soft colors, zen-like",
    playful: "bouncy and fun, dynamic pose, energetic",
  };

  const style = styleDescriptions[args.style || "kawaii"];
  const mood = moodDescriptions[args.mood || "happy"];
  const sparkles = args.with_sparkles ? ", surrounded by sparkles and small stars" : "";
  const bg = args.transparent_bg ? ", on transparent background, PNG format" : ", on solid color background";

  const prompt = `Sticker design of ${args.concept}. ${style}. ${mood}${sparkles}${bg}. Haven's Living Garden color palette: rose (#FF6B8A), violet (#7C5CFC), teal (#00C9A7), amber (#FFB84D). Perfect for digital stickers or reactions.`;

  if (openai) {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    return {
      type: "sticker_generated",
      url: response.data[0]?.url,
      revised_prompt: response.data[0]?.revised_prompt,
      concept: args.concept,
      applied_style: args.style || "kawaii",
      note: "Sticker generated! For best results, remove background using a tool like remove.bg",
    };
  }

  return {
    type: "sticker_prompt",
    prompt: prompt,
    concept: args.concept,
    note: "No API configured. Use this prompt with DALL-E, Midjourney, or share with a designer.",
  };
}

async function handleGenerateLogo(args: {
  name: string;
  type?: string;
  colors?: string[];
  include_bloom?: boolean;
  style?: string;
}) {
  const typeDescriptions: Record<string, string> = {
    icon: "simple icon/symbol only, no text, recognizable at small sizes",
    wordmark: "stylized text/typography logo, creative letterforms",
    combination: "icon with accompanying text, balanced composition",
    mascot: "character-based logo, friendly and approachable",
    abstract: "abstract geometric shapes, modern and unique",
  };

  const styleDescriptions: Record<string, string> = {
    modern: "clean contemporary design, sophisticated and professional",
    playful: "fun and energetic, rounded shapes, friendly feel",
    elegant: "refined and graceful, subtle details, premium feel",
    organic: "natural flowing shapes, garden-inspired, soft curves",
    geometric: "precise geometric shapes, structured and bold",
  };

  const colors = args.colors?.includes("rainbow")
    ? HAVEN_COLORS.rainbow.join(", ")
    : args.colors?.join(", ") || `${HAVEN_COLORS.violet}, ${HAVEN_COLORS.teal}, ${HAVEN_COLORS.rose}`;

  const bloomAddition = args.include_bloom
    ? ", incorporating Bloom the rainbow spirit mascot - a cute glowing figure with gradient rainbow colors and sparkles"
    : "";

  const prompt = `Logo design for "${args.name}". ${typeDescriptions[args.type || "combination"]}. Style: ${styleDescriptions[args.style || "playful"]}. Colors: ${colors}${bloomAddition}. Part of Haven's Living Garden design system - warm, inclusive, LGBTQIA+ friendly.`;

  if (openai) {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    return {
      type: "logo_generated",
      url: response.data[0]?.url,
      revised_prompt: response.data[0]?.revised_prompt,
      name: args.name,
      specifications: {
        type: args.type || "combination",
        style: args.style || "playful",
        colors: colors,
        includes_bloom: args.include_bloom || false,
      },
      note: "Logo concept generated. For production use, recreate in vector format (SVG) using Figma or Illustrator.",
    };
  }

  return {
    type: "logo_prompt",
    prompt: prompt,
    specifications: {
      type: args.type || "combination",
      style: args.style || "playful",
      colors: colors,
    },
    note: "No API configured. Share this prompt with a designer or use with AI image generators.",
  };
}

function handleGetDesignReferences(args: {
  search_query: string;
  platforms?: string[];
  category?: string;
  for_feature?: string;
}) {
  const platforms = args.platforms || ["dribbble", "mobbin", "pinterest"];
  const encodedQuery = encodeURIComponent(args.search_query);

  const references = platforms.map((platform) => ({
    platform,
    url: `${DESIGN_REFERENCES[platform as keyof typeof DESIGN_REFERENCES]}${encodedQuery}`,
  }));

  const havenContext = args.for_feature
    ? `For Haven's ${args.for_feature} feature. Remember to apply Living Garden aesthetic: warm cream backgrounds, rainbow accents, soft animations, Bloom mascot for empty states.`
    : "";

  const categoryTips: Record<string, string> = {
    ui_pattern: "Focus on interaction patterns, component layouts, and user flows",
    color_palette: "Look for palettes that complement rose, violet, teal, amber",
    typography: "Find type pairings that match Quicksand (headings) + Nunito (body)",
    illustration: "Seek inclusive, diverse illustrations with soft, friendly style",
    animation: "Look for micro-interactions and delightful transitions",
    branding: "Study how brands balance playfulness with trust/safety",
  };

  return {
    type: "design_references",
    search_query: args.search_query,
    references: references,
    category_tip: categoryTips[args.category || "ui_pattern"],
    haven_context: havenContext,
    curated_sites: [
      "https://www.checklist.design - UI/UX patterns",
      "https://www.uisources.com - Real app screenshots",
      "https://pageflows.com - User flow references",
      "https://www.lottiefiles.com - Animation inspiration",
      "https://www.happyhues.co - Color palette ideas",
    ],
  };
}

function handleGenerateColorPalette(args: {
  base_color?: string;
  mood: string;
  count?: number;
  include_haven_colors?: boolean;
  for_dark_mode?: boolean;
}) {
  const count = Math.min(Math.max(args.count || 5, 3), 8);

  const moodPalettes: Record<string, string[]> = {
    warm: ["#FF6B8A", "#FFAA85", "#FFB84D", "#FFE4BC", "#FFF5E9"],
    cool: ["#4DA6FF", "#7C5CFC", "#B4A7FF", "#00C9A7", "#38D9A9"],
    vibrant: ["#FF6B8A", "#FFB84D", "#00C9A7", "#4DA6FF", "#7C5CFC"],
    soft: ["#FFD4DD", "#FFE4BC", "#D4F5ED", "#D4E8FF", "#E8E0FF"],
    dark: ["#1A1625", "#241F31", "#2D2640", "#3D3555", "#4D456A"],
    light: ["#FFFBF7", "#FFF5F0", "#F5F0FF", "#F0FFF5", "#FFF0F5"],
    rainbow: HAVEN_COLORS.rainbow,
  };

  let palette = moodPalettes[args.mood] || moodPalettes.vibrant;

  if (args.include_haven_colors) {
    palette = [...new Set([...palette, ...Object.values(HAVEN_COLORS).flat()])].slice(0, count);
  }

  const cssVariables = palette
    .map((color, i) => `--color-${i + 1}: ${color};`)
    .join("\n  ");

  const tailwindColors = palette.reduce((acc, color, i) => {
    acc[`custom-${i + 1}`] = color;
    return acc;
  }, {} as Record<string, string>);

  return {
    type: "color_palette",
    mood: args.mood,
    colors: palette.slice(0, count),
    for_dark_mode: args.for_dark_mode,
    css: `:root {\n  ${cssVariables}\n}`,
    tailwind_config: tailwindColors,
    usage_tips: args.for_dark_mode
      ? "For dark mode: Use darker shades as backgrounds, lighter accents for interactive elements"
      : "For light mode: Use warm cream (#FFFBF7) as base, colors as accents",
  };
}

function handleGenerateGradient(args: {
  style: string;
  colors?: string[];
  direction?: string;
  animated?: boolean;
}) {
  const colors = args.colors?.includes("pride")
    ? HAVEN_COLORS.rainbow
    : args.colors || [HAVEN_COLORS.rose, HAVEN_COLORS.violet, HAVEN_COLORS.teal];

  const colorStops = colors.join(", ");
  let css = "";
  let tailwind = "";

  switch (args.style) {
    case "linear":
      const direction = args.direction || "to right";
      css = `background: linear-gradient(${direction}, ${colorStops});`;
      tailwind = `bg-gradient-to-r from-[${colors[0]}] via-[${colors[1]}] to-[${colors[2]}]`;
      break;
    case "radial":
      css = `background: radial-gradient(circle, ${colorStops});`;
      tailwind = "Use custom CSS for radial gradients";
      break;
    case "conic":
      css = `background: conic-gradient(from 0deg, ${colorStops});`;
      tailwind = "Use custom CSS for conic gradients";
      break;
    case "mesh":
      css = `
background-color: ${colors[0]};
background-image:
  radial-gradient(at 40% 20%, ${colors[1]} 0px, transparent 50%),
  radial-gradient(at 80% 0%, ${colors[2]} 0px, transparent 50%),
  radial-gradient(at 0% 50%, ${colors[0]} 0px, transparent 50%),
  radial-gradient(at 80% 50%, ${colors[1]} 0px, transparent 50%),
  radial-gradient(at 0% 100%, ${colors[2]} 0px, transparent 50%);`;
      tailwind = "Use custom CSS for mesh gradients";
      break;
  }

  const animatedCss = args.animated
    ? `
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-gradient {
  ${css}
  background-size: 200% 200%;
  animation: gradient-flow 4s ease infinite;
}`
    : css;

  return {
    type: "gradient",
    style: args.style,
    colors: colors,
    css: animatedCss,
    tailwind: tailwind,
    animated: args.animated,
    preview_tip: "Test gradients at https://cssgradient.io or https://www.joshwcomeau.com/gradient-generator/",
  };
}

function handleSuggestVisualEnhancement(args: {
  page_or_component: string;
  current_issues?: string;
  inspiration_style?: string;
  focus_areas?: string[];
}) {
  const focusAreas = args.focus_areas || ["colors", "animations", "imagery"];

  const suggestions: Record<string, string[]> = {
    colors: [
      "Add gradient backgrounds using Haven's rainbow colors for headers",
      "Use color-coded sections (rose for safety, teal for community, violet for professionals)",
      "Add subtle color shifts on hover/focus states",
      "Implement ambient color zones that change based on content type",
    ],
    animations: [
      "Add staggered fadeUp for list items (0.05s delay between each)",
      "Implement card hover: translateY(-4px) with soft shadow",
      "Add loading skeletons with shimmer effect",
      "Use Bloom mascot with floating animation in empty states",
      "Add confetti animation on successful actions (join, RSVP, first post)",
      "Implement smooth page transitions with Framer Motion",
    ],
    icons: [
      "Replace generic icons with custom Haven-themed SVGs",
      "Add animated icons for navigation (subtle bounce on active)",
      "Use sticker reactions instead of plain emojis",
      "Create unique icons for each community category",
    ],
    typography: [
      "Add gradient text effect for headings using pride colors",
      "Use larger, bolder Quicksand for emotional headlines",
      "Add subtle text shadow for hero sections",
      "Implement animated typing effect for welcome messages",
    ],
    spacing: [
      "Increase padding for more breathing room",
      "Use card-based layouts with consistent 16px/24px spacing",
      "Add decorative dividers with subtle patterns",
      "Create visual hierarchy with varied section heights",
    ],
    imagery: [
      "Add Bloom mascot variations throughout the app",
      "Use illustrated backgrounds for feature sections",
      "Create custom placeholder images instead of gray boxes",
      "Add floating decorative shapes (hearts, stars, flowers)",
    ],
    interactivity: [
      "Add micro-interactions on all buttons (scale, color shift)",
      "Implement pull-to-refresh with custom animation",
      "Add haptic feedback patterns for mobile",
      "Create interactive onboarding with Bloom guide",
    ],
  };

  const relevantSuggestions = focusAreas.flatMap((area) => suggestions[area] || []);

  const componentSpecificTips: Record<string, string[]> = {
    "landing page": [
      "Hero: Animated mesh gradient background with floating pride elements",
      "Features: Staggered card entrance with hover lift effect",
      "CTA: Pulsing rainbow border animation",
      "Testimonials: Carousel with smooth transitions",
    ],
    "profile card": [
      "Animated border gradient on hover",
      "Avatar with pride ring effect",
      "Skills as colorful pill badges",
      "Verification badge with sparkle animation",
    ],
    feed: [
      "Post cards with subtle entry animation",
      "Reaction picker as floating emoji panel",
      "Image posts with zoom preview",
      "Loading: Animated skeleton matching card layout",
    ],
    directory: [
      "Filter chips with bouncy selection animation",
      "Grid/list toggle with smooth morph",
      "Search with live results animation",
      "Empty state: Bloom with magnifying glass",
    ],
    chat: [
      "Message bubbles with pop-in animation",
      "Typing indicator with bouncing dots",
      "Reactions as floating stickers",
      "Send button with satisfying animation",
    ],
  };

  const pageTips = componentSpecificTips[args.page_or_component.toLowerCase()] || [];

  return {
    type: "visual_enhancement",
    target: args.page_or_component,
    current_issues: args.current_issues,
    focus_areas: focusAreas,
    suggestions: relevantSuggestions,
    component_specific: pageTips,
    quick_wins: [
      "Add Framer Motion's layout prop for smooth reflows",
      "Use AnimatePresence for enter/exit animations",
      "Apply backdrop-blur-sm for modern glass effects",
      "Add ring-4 ring-offset-2 for focus states",
    ],
    haven_principles: [
      "Warmth: Cream backgrounds, soft shadows, rounded corners",
      "Joy: Rainbow accents, celebrations, playful animations",
      "Safety: Clear visual hierarchy, predictable patterns",
      "Inclusion: Diverse illustrations, accessible contrast",
    ],
  };
}

function handleCreateAnimationConfig(args: {
  animation_type: string;
  element: string;
  intensity?: string;
  duration?: number;
}) {
  const duration = args.duration || 0.3;
  const intensity = args.intensity || "moderate";

  const intensityScale: Record<string, number> = {
    subtle: 0.5,
    moderate: 1,
    playful: 1.5,
    dramatic: 2,
  };

  const scale = intensityScale[intensity];

  const animations: Record<string, object> = {
    entrance: {
      initial: { opacity: 0, y: 20 * scale },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration, ease: "easeOut" },
    },
    exit: {
      exit: { opacity: 0, y: -20 * scale },
      transition: { duration: duration * 0.8, ease: "easeIn" },
    },
    hover: {
      whileHover: {
        scale: 1 + 0.02 * scale,
        y: -4 * scale,
        transition: { duration: 0.2 },
      },
    },
    tap: {
      whileTap: { scale: 1 - 0.02 * scale },
    },
    scroll: {
      initial: { opacity: 0, y: 50 * scale },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-100px" },
      transition: { duration: duration * 1.5 },
    },
    stagger: {
      variants: {
        container: {
          animate: { transition: { staggerChildren: 0.05 * scale } },
        },
        item: {
          initial: { opacity: 0, y: 20 * scale },
          animate: { opacity: 1, y: 0 },
        },
      },
    },
    morph: {
      layout: true,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
    floating: {
      animate: {
        y: [0, -10 * scale, 0],
        rotate: [-2 * scale, 2 * scale, -2 * scale],
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    celebration: {
      initial: { scale: 0, rotate: -180 },
      animate: {
        scale: [0, 1.2, 1],
        rotate: [0, 360],
      },
      transition: { duration: 0.6, ease: "backOut" },
    },
  };

  const config = animations[args.animation_type] || animations.entrance;

  const codeExample = `
import { motion } from 'framer-motion';

export function Animated${args.element.replace(/\s+/g, "")}({ children }) {
  return (
    <motion.div
      ${JSON.stringify(config, null, 6).slice(1, -1)}
    >
      {children}
    </motion.div>
  );
}`;

  return {
    type: "animation_config",
    animation_type: args.animation_type,
    element: args.element,
    intensity: intensity,
    framer_motion: config,
    code_example: codeExample,
    tips: [
      "Wrap parent with AnimatePresence for exit animations",
      "Use layout prop for automatic reflow animations",
      "Add layoutId for shared element transitions",
      "Use whileInView for scroll-triggered animations",
    ],
  };
}

function handleGenerateSvgPattern(args: {
  pattern_type: string;
  colors?: string[];
  density?: string;
  animated?: boolean;
}) {
  const colors = args.colors || [HAVEN_COLORS.rose, HAVEN_COLORS.violet, HAVEN_COLORS.teal];
  const density = args.density || "medium";

  const densitySpacing: Record<string, number> = {
    sparse: 40,
    medium: 24,
    dense: 12,
  };

  const spacing = densitySpacing[density];

  const patterns: Record<string, string> = {
    dots: `
<pattern id="haven-dots" patternUnits="userSpaceOnUse" width="${spacing}" height="${spacing}">
  <circle cx="${spacing / 2}" cy="${spacing / 2}" r="2" fill="${colors[0]}" fill-opacity="0.3"/>
</pattern>`,
    waves: `
<pattern id="haven-waves" patternUnits="userSpaceOnUse" width="${spacing * 2}" height="${spacing}">
  <path d="M0 ${spacing / 2} Q${spacing / 2} 0 ${spacing} ${spacing / 2} T${spacing * 2} ${spacing / 2}"
        fill="none" stroke="${colors[0]}" stroke-width="1.5" stroke-opacity="0.2"/>
</pattern>`,
    flowers: `
<pattern id="haven-flowers" patternUnits="userSpaceOnUse" width="${spacing * 2}" height="${spacing * 2}">
  <g transform="translate(${spacing} ${spacing})" fill-opacity="0.15">
    ${colors.map((c, i) => `<circle cx="0" cy="-6" r="4" fill="${c}" transform="rotate(${i * 72})"/>`).join("")}
    <circle cx="0" cy="0" r="3" fill="${colors[1]}"/>
  </g>
</pattern>`,
    hearts: `
<pattern id="haven-hearts" patternUnits="userSpaceOnUse" width="${spacing * 2}" height="${spacing * 2}">
  <path d="M${spacing} ${spacing + 2}
           C${spacing - 4} ${spacing - 2} ${spacing - 6} ${spacing - 6} ${spacing} ${spacing - 10}
           C${spacing + 6} ${spacing - 6} ${spacing + 4} ${spacing - 2} ${spacing} ${spacing + 2}Z"
        fill="${colors[0]}" fill-opacity="0.15"/>
</pattern>`,
    stars: `
<pattern id="haven-stars" patternUnits="userSpaceOnUse" width="${spacing * 2}" height="${spacing * 2}">
  <polygon points="${spacing},${spacing - 6} ${spacing + 2},${spacing} ${spacing + 6},${spacing} ${spacing + 3},${spacing + 3} ${spacing + 4},${spacing + 8} ${spacing},${spacing + 5} ${spacing - 4},${spacing + 8} ${spacing - 3},${spacing + 3} ${spacing - 6},${spacing} ${spacing - 2},${spacing}"
           fill="${colors[0]}" fill-opacity="0.12"/>
</pattern>`,
    geometric: `
<pattern id="haven-geo" patternUnits="userSpaceOnUse" width="${spacing * 2}" height="${spacing * 2}">
  <rect x="${spacing / 2}" y="${spacing / 2}" width="${spacing}" height="${spacing}"
        fill="none" stroke="${colors[0]}" stroke-width="1" stroke-opacity="0.15"
        transform="rotate(45 ${spacing} ${spacing})"/>
</pattern>`,
    organic: `
<pattern id="haven-organic" patternUnits="userSpaceOnUse" width="${spacing * 3}" height="${spacing * 3}">
  <path d="M0 ${spacing} Q${spacing} 0 ${spacing * 2} ${spacing} T${spacing * 3} ${spacing * 2}"
        fill="none" stroke="${colors[0]}" stroke-width="2" stroke-opacity="0.1"/>
  <circle cx="${spacing * 1.5}" cy="${spacing * 0.5}" r="3" fill="${colors[1]}" fill-opacity="0.15"/>
</pattern>`,
    confetti: `
<pattern id="haven-confetti" patternUnits="userSpaceOnUse" width="${spacing * 4}" height="${spacing * 4}">
  <rect x="4" y="8" width="3" height="6" fill="${colors[0]}" fill-opacity="0.2" transform="rotate(15)"/>
  <rect x="${spacing * 2}" y="4" width="3" height="6" fill="${colors[1]}" fill-opacity="0.2" transform="rotate(-20)"/>
  <circle cx="${spacing * 3}" cy="${spacing * 2}" r="2" fill="${colors[2]}" fill-opacity="0.2"/>
  <rect x="${spacing}" y="${spacing * 3}" width="3" height="6" fill="${colors[0]}" fill-opacity="0.2" transform="rotate(30)"/>
</pattern>`,
  };

  const svg = patterns[args.pattern_type] || patterns.dots;

  const animatedCss = args.animated
    ? `
@keyframes pattern-drift {
  0% { background-position: 0 0; }
  100% { background-position: ${spacing * 4}px ${spacing * 4}px; }
}

.animated-pattern {
  animation: pattern-drift 20s linear infinite;
}`
    : "";

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    ${svg}
  </defs>
  <rect width="100%" height="100%" fill="url(#haven-${args.pattern_type})"/>
</svg>`;

  return {
    type: "svg_pattern",
    pattern_type: args.pattern_type,
    density: density,
    colors: colors,
    svg: fullSvg,
    css_usage: `background-image: url("data:image/svg+xml,${encodeURIComponent(fullSvg.replace(/\s+/g, " "))}");`,
    animated_css: animatedCss,
    component_usage: `
import React from 'react';

export function ${args.pattern_type.charAt(0).toUpperCase() + args.pattern_type.slice(1)}Pattern() {
  return (
    <div
      className="absolute inset-0 opacity-50 pointer-events-none"
      style={{
        backgroundImage: \`url("data:image/svg+xml,${encodeURIComponent(fullSvg.replace(/\s+/g, " "))}")\`
      }}
    />
  );
}`,
  };
}

function handleGenerateIllustrationPrompt(args: {
  scene: string;
  include_bloom?: boolean;
  style?: string;
  mood?: string;
  for_feature?: string;
}) {
  const styleDescriptions: Record<string, string> = {
    flat_vector: "flat vector illustration, clean shapes, bold colors, modern design",
    isometric: "isometric 3D illustration, geometric perspective, detailed scene",
    hand_drawn: "hand-drawn illustration style, sketch-like lines, organic feel, warm and personal",
    "3d_render": "3D rendered illustration, soft lighting, rounded shapes, Pixar/Blender style",
    watercolor: "watercolor painting style, soft edges, blended colors, artistic texture",
    geometric: "geometric abstract illustration, shapes and patterns, modern art style",
  };

  const moodDescriptions: Record<string, string> = {
    joyful: "bright and cheerful atmosphere, celebrating diversity, rainbow accents, smiling faces",
    peaceful: "calm and serene setting, soft colors, safe space feeling, gentle lighting",
    empowering: "strong and confident energy, uplifting message, bold stance, inspiring",
    cozy: "warm and intimate atmosphere, soft textures, homey feeling, comfortable",
    celebratory: "festive and exciting, confetti and decorations, party atmosphere, pride celebration",
    supportive: "caring and nurturing environment, embrace, community support, together",
  };

  const style = styleDescriptions[args.style || "flat_vector"];
  const mood = moodDescriptions[args.mood || "joyful"];

  const bloomDescription = args.include_bloom
    ? `Include Bloom, Haven's rainbow spirit mascot: a cute, glowing figure with a body made of flowing rainbow gradients (rose #FF6B8A, amber #FFB84D, teal #00C9A7, sky #4DA6FF, violet #7C5CFC), with gentle sparkles around them, expressive eyes, and a warm, friendly presence. Bloom should be ${args.mood === "joyful" ? "smiling happily" : args.mood === "supportive" ? "offering a warm embrace" : "floating peacefully"}.`
    : "";

  const featureContext = args.for_feature
    ? `This illustration is for Haven's ${args.for_feature} feature - a privacy-first LGBTQIA+ community platform in India.`
    : "";

  const fullPrompt = `
ILLUSTRATION PROMPT FOR: ${args.scene}

STYLE: ${style}

MOOD & ATMOSPHERE: ${mood}

${bloomDescription}

COLOR PALETTE (Haven's Living Garden):
- Primary: Warm cream background (#FFFBF7)
- Accents: Rose (#FF6B8A), Violet (#7C5CFC), Teal (#00C9A7), Amber (#FFB84D)
- Rainbow gradient for highlights
- Soft shadows, no harsh contrasts

DESIGN PRINCIPLES:
- Inclusive representation: diverse body types, skin tones, gender expressions
- Warm and welcoming atmosphere
- Pride elements integrated naturally (rainbow accents, not overwhelming)
- Organic, garden-inspired shapes (flowers, leaves, soft curves)
- Accessible: clear visual hierarchy, good contrast

${featureContext}

COMPOSITION SUGGESTIONS:
- Leave space for text overlay if needed
- Create visual flow that guides the eye
- Balance detailed elements with breathing room
- Consider both light and dark mode compatibility

AVOID:
- Harsh, corporate aesthetics
- Stereotypical or tokenistic representation
- Aggressive or unwelcoming imagery
- Cluttered or overwhelming compositions
`.trim();

  return {
    type: "illustration_prompt",
    scene: args.scene,
    style: args.style || "flat_vector",
    mood: args.mood || "joyful",
    includes_bloom: args.include_bloom || false,
    for_feature: args.for_feature,
    full_prompt: fullPrompt,
    quick_version: `${args.scene}. ${style}. ${mood}. Haven's Living Garden colors: cream, rose, violet, teal, amber. ${args.include_bloom ? "Include cute rainbow Bloom mascot." : ""} Diverse, inclusive, warm.`,
    recommended_tools: [
      "DALL-E 3 (OpenAI) - Best for accurate prompt following",
      "Midjourney - Best for artistic quality",
      "Stable Diffusion - Best for iteration and customization",
      "Figma + AI plugins - Best for UI illustrations",
    ],
  };
}

// Main server setup
const server = new Server(
  {
    name: "haven-asset-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "generate_image":
        result = await handleGenerateImage(args as Parameters<typeof handleGenerateImage>[0]);
        break;
      case "generate_sticker":
        result = await handleGenerateSticker(args as Parameters<typeof handleGenerateSticker>[0]);
        break;
      case "generate_logo":
        result = await handleGenerateLogo(args as Parameters<typeof handleGenerateLogo>[0]);
        break;
      case "get_design_references":
        result = handleGetDesignReferences(args as Parameters<typeof handleGetDesignReferences>[0]);
        break;
      case "generate_color_palette":
        result = handleGenerateColorPalette(args as Parameters<typeof handleGenerateColorPalette>[0]);
        break;
      case "generate_gradient":
        result = handleGenerateGradient(args as Parameters<typeof handleGenerateGradient>[0]);
        break;
      case "suggest_visual_enhancement":
        result = handleSuggestVisualEnhancement(args as Parameters<typeof handleSuggestVisualEnhancement>[0]);
        break;
      case "create_animation_config":
        result = handleCreateAnimationConfig(args as Parameters<typeof handleCreateAnimationConfig>[0]);
        break;
      case "generate_svg_pattern":
        result = handleGenerateSvgPattern(args as Parameters<typeof handleGenerateSvgPattern>[0]);
        break;
      case "generate_illustration_prompt":
        result = handleGenerateIllustrationPrompt(args as Parameters<typeof handleGenerateIllustrationPrompt>[0]);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Initialize and run
async function main() {
  initializeClients();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Haven Asset Generator MCP server running");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
