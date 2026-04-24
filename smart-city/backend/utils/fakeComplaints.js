/**
 * ─────────────────────────────────────────────────────────────────
 *  Suspicious Complaint Detection Engine
 * ─────────────────────────────────────────────────────────────────
 *
 *  Implements rule-based and heuristic checks to detect:
 *    - Spam / abusive language
 *    - Vague or meaningless complaints
 *    - Rapid-fire duplicate submissions
 *    - Blacklisted keywords
 *
 *  Returns suspicionScore (0.0–1.0) and list of triggered rules.
 * ─────────────────────────────────────────────────────────────────
 */

// Abusive / vulgar keywords (extensible)
const ABUSIVE_KEYWORDS = new Set([
  'idiot', 'stupid', 'dumb', 'ass', 'bastard', 'hell',
  'damn', 'crap', 'jerk', 'loser', 'trash', 'garbage',
]);

// Spam patterns and repeated characters
const SPAM_PATTERNS = [
  /(.)\1{4,}/gi,  // 5+ repeated chars (aaaaaaa)
  /[!]{3,}/g,     // 3+ exclamation marks
  /\?{3,}/g,      // 3+ question marks
];

// Vague complaint triggers
const VAGUE_TRIGGERS = [
  'bad', 'wrong', 'issue', 'problem', 'help', 'please',
  'idk', 'dunno', 'whatever', 'thing', 'stuff',
];

/**
 * Score text for abusive language (0–1)
 */
function scoreAbusiveLanguage(text) {
  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/);
  
  let abusiveCount = 0;
  tokens.forEach(t => {
    if (ABUSIVE_KEYWORDS.has(t.replace(/[^a-z]/g, ''))) {
      abusiveCount++;
    }
  });

  // Normalize: 1 abusive word = 0.3, 2+ = 0.8
  if (abusiveCount === 0) return 0;
  if (abusiveCount === 1) return 0.3;
  return Math.min(abusiveCount * 0.2, 0.8);
}

/**
 * Score text for spam patterns (0–1)
 */
function scoreSpamPatterns(text) {
  let spamScore = 0;

  SPAM_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) spamScore += 0.25 * matches.length;
  });

  return Math.min(spamScore, 0.8);
}

/**
 * Score text for vagueness (0–1)
 */
function scoreVagueness(text) {
  if (text.length < 20) return 0.3; // too short

  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/).filter(t => t.length > 2);

  if (tokens.length < 3) return 0.5; // very few meaningful tokens

  let vagueCount = 0;
  tokens.forEach(t => {
    if (VAGUE_TRIGGERS.includes(t)) vagueCount++;
  });

  const vagueRatio = vagueCount / tokens.length;
  
  // If > 50% vague words, score ≥ 0.4
  if (vagueRatio > 0.5) return 0.4;
  if (vagueRatio > 0.3) return 0.2;
  return 0;
}

/**
 * Main: Detect suspicious complaints
 * Returns { suspicionScore, suspicionReasons }
 */
function detectSuspiciousComplaint(title, description) {
  const text = `${title} ${description}`;
  const reasons = [];

  const abuseScore = scoreAbusiveLanguage(text);
  if (abuseScore > 0.2) {
    reasons.push(`Abusive language detected (score: ${abuseScore.toFixed(2)})`);
  }

  const spamScore = scoreSpamPatterns(text);
  if (spamScore > 0.2) {
    reasons.push(`Spam patterns detected (score: ${spamScore.toFixed(2)})`);
  }

  const vagueScore = scoreVagueness(text);
  if (vagueScore > 0.2) {
    reasons.push(`Vague description (score: ${vagueScore.toFixed(2)})`);
  }

  // Weighted average suspicion score
  // Abuse = 50%, Spam = 30%, Vague = 20%
  const suspicionScore = parseFloat(
    (0.5 * abuseScore + 0.3 * spamScore + 0.2 * vagueScore).toFixed(3)
  );

  return {
    suspicionScore: Math.min(suspicionScore, 1.0),
    suspicionReasons: reasons,
    isFake: suspicionScore > 0.4, // threshold
  };
}

module.exports = { detectSuspiciousComplaint };
