/**
 * Perspective API integration for content moderation
 * https://perspectiveapi.com/
 *
 * This is a free API from Google that detects toxic content.
 * We use it to flag potentially harmful content for review.
 */

interface PerspectiveResponse {
  attributeScores: {
    [key: string]: {
      summaryScore: {
        value: number;
        type: string;
      };
    };
  };
  languages: string[];
}

interface ModerationResult {
  shouldBlock: boolean;
  shouldFlag: boolean;
  scores: {
    toxicity: number;
    severeToxicity: number;
    identityAttack: number;
    insult: number;
    threat: number;
  };
  reason?: string;
}

// Thresholds for moderation decisions
const THRESHOLDS = {
  // Block content immediately if any score exceeds this
  BLOCK: 0.9,
  // Flag content for review if any score exceeds this
  FLAG: 0.7,
};

/**
 * Analyze text content for toxicity using Perspective API
 */
export async function analyzeContent(text: string): Promise<ModerationResult> {
  const apiKey = process.env.PERSPECTIVE_API_KEY;

  // If no API key, allow content through (development mode)
  if (!apiKey) {
    console.warn("Perspective API key not configured, skipping moderation");
    return {
      shouldBlock: false,
      shouldFlag: false,
      scores: {
        toxicity: 0,
        severeToxicity: 0,
        identityAttack: 0,
        insult: 0,
        threat: 0,
      },
    };
  }

  // Skip very short content
  if (text.trim().length < 3) {
    return {
      shouldBlock: false,
      shouldFlag: false,
      scores: {
        toxicity: 0,
        severeToxicity: 0,
        identityAttack: 0,
        insult: 0,
        threat: 0,
      },
    };
  }

  try {
    const response = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: { text },
          languages: ["en"],
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            THREAT: {},
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Perspective API error:",
        response.status,
        await response.text()
      );
      // Fail open - allow content if API fails
      return {
        shouldBlock: false,
        shouldFlag: false,
        scores: {
          toxicity: 0,
          severeToxicity: 0,
          identityAttack: 0,
          insult: 0,
          threat: 0,
        },
      };
    }

    const data: PerspectiveResponse = await response.json();

    const scores = {
      toxicity:
        data.attributeScores.TOXICITY?.summaryScore.value ?? 0,
      severeToxicity:
        data.attributeScores.SEVERE_TOXICITY?.summaryScore.value ?? 0,
      identityAttack:
        data.attributeScores.IDENTITY_ATTACK?.summaryScore.value ?? 0,
      insult: data.attributeScores.INSULT?.summaryScore.value ?? 0,
      threat: data.attributeScores.THREAT?.summaryScore.value ?? 0,
    };

    // Check for blocking threshold
    const maxScore = Math.max(...Object.values(scores));
    const shouldBlock = maxScore >= THRESHOLDS.BLOCK;
    const shouldFlag = maxScore >= THRESHOLDS.FLAG;

    // Determine reason if flagged
    let reason: string | undefined;
    if (shouldBlock || shouldFlag) {
      const highestAttribute = Object.entries(scores).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );
      reason = highestAttribute[0];
    }

    return {
      shouldBlock,
      shouldFlag,
      scores,
      reason,
    };
  } catch (error) {
    console.error("Perspective API error:", error);
    // Fail open - allow content if API fails
    return {
      shouldBlock: false,
      shouldFlag: false,
      scores: {
        toxicity: 0,
        severeToxicity: 0,
        identityAttack: 0,
        insult: 0,
        threat: 0,
      },
    };
  }
}

/**
 * Check if content passes moderation
 * Returns { allowed: true } or { allowed: false, message: string }
 */
export async function moderateContent(
  text: string
): Promise<{ allowed: boolean; message?: string; flagged?: boolean }> {
  const result = await analyzeContent(text);

  if (result.shouldBlock) {
    return {
      allowed: false,
      message: "This content appears to violate our community guidelines. Please revise and try again.",
    };
  }

  if (result.shouldFlag) {
    // Content is allowed but flagged for review
    return {
      allowed: true,
      flagged: true,
    };
  }

  return { allowed: true, flagged: false };
}
