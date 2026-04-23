/**
 * ─────────────────────────────────────────────────────────────────
 *  Smart Similarity Engine — Pure JS ML for complaint clustering
 * ─────────────────────────────────────────────────────────────────
 *
 *  Algorithms used:
 *    1. TF-IDF (Term Frequency–Inverse Document Frequency) vectors
 *    2. Cosine Similarity  — text content matching
 *    3. Jaccard Similarity — location word overlap
 *    4. Weighted Category Scoring — ML-enhanced auto-categorization
 *
 *  Final similarity = 0.55 × text_cosine + 0.30 × location_jaccard + 0.15 × category_bonus
 *  Merge threshold  = 0.40 (configurable via SIMILARITY_THRESHOLD)
 * ─────────────────────────────────────────────────────────────────
 */

// Common English stop-words to ignore
const STOPWORDS = new Set([
  'the','a','an','is','it','in','on','at','to','of','for','and','or',
  'but','not','with','this','that','was','are','were','be','been','my',
  'our','i','we','they','he','she','its','there','has','have','had',
  'from','by','as','so','if','do','did','will','can','could','would',
  'should','about','near','just','very','also','some','any','all','no',
]);

/**
 * Tokenise text: lowercase, strip punctuation, remove stopwords, stem lightly
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Build a simple TF (term-frequency) map from a token array
 */
function buildTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(k => { tf[k] /= total; });
  return tf;
}

/**
 * Cosine similarity between two TF maps
 */
function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  keys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot  += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Jaccard similarity between two token sets
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Text similarity using TF vectors + cosine
 */
function textSimilarity(textA, textB) {
  const tA = tokenize(textA);
  const tB = tokenize(textB);
  if (tA.length === 0 || tB.length === 0) return 0;
  return cosineSimilarity(buildTF(tA), buildTF(tB));
}

/**
 * Location similarity using Jaccard on word tokens
 */
function locationSimilarity(locA, locB) {
  return jaccardSimilarity(
    new Set(tokenize(locA)),
    new Set(tokenize(locB))
  );
}

/**
 * Combined complaint similarity score (0 – 1)
 * 
 * Formula from plan:
 * textSim   = cosine(TF(incoming), TF(existing))   → 0.0–1.0
 * locSim    = jaccard(tokens(loc_A), tokens(loc_B)) → 0.0–1.0
 * catBonus  = 0.15 if same category else 0
 * score     = 0.55×textSim + 0.30×locSim + catBonus
 */
function computeComplaintSimilarity(complaintA, complaintB) {
  const textA = `${complaintA.title} ${complaintA.description}`;
  const textB = `${complaintB.title} ${complaintB.description}`;

  const categoryBon = complaintA.category === complaintB.category ? 0.15 : 0;

  const score = 0.55 * textSim + 0.30 * locSim + categoryBon;
  return Math.min(parseFloat(score.toFixed(4)), 1.0);
}

// ─────────────────────────────────────────────────────────────────
//  ML-Enhanced Auto-Categorization (weighted keyword scoring)
// ─────────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  Sanitation: {
    high:   ['garbage','waste','trash','sewage','dump','litter','rubbish','filth','stink'],
    medium: ['smell','dirty','disposal','bin','drain','manhole','overflowing'],
    low:    ['collected','pickup','odor','hygiene'],
  },
  Roads: {
    high:   ['pothole','road','highway','pavement','asphalt','crack','bump','crater'],
    medium: ['traffic','signal','sign','lane','bridge','sidewalk','footpath','divider'],
    low:    ['vehicle','accident','damage','speed'],
  },
  'Water Department': {
    high:   ['water','leak','pipe','flood','sewage','supply','drainage','burst'],
    medium: ['tap','flow','pressure','puddle','overflow','contamination','murky'],
    low:    ['wet','damp','moisture','clog'],
  },
  Electrical: {
    high:   ['electricity','electric','power','light','streetlight','outage','wire','cable'],
    medium: ['blackout','transformer','voltage','lamp','pole','fuse','sparking'],
    low:    ['dark','shock','spark','short','trip'],
  },
};

/**
 * Score each category and return best match + confidence (0–100%)
 */
function autoCategorizeML(text) {
  const t = text.toLowerCase();
  const scores = {};

  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    kw.high.forEach(k   => { if (t.includes(k)) score += 3; });
    kw.medium.forEach(k => { if (t.includes(k)) score += 2; });
    kw.low.forEach(k    => { if (t.includes(k)) score += 1; });
    scores[cat] = score;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return { category: 'General', confidence: 0, scores };

  const category   = Object.keys(scores).find(k => scores[k] === maxScore);
  // Max possible score per category ≈ 9*3+7*2+4*1=45 → normalize to 0-1
  const confidence = parseFloat(Math.min(maxScore / 12, 1).toFixed(2));

  return { category, confidence, scores };
}

// Similarity threshold — complaints above this are merged
const SIMILARITY_THRESHOLD = 0.40;

/**
 * Rule-based fake complaint detection
 */
function detectFakeComplaint(title, description, name, contact) {
  const text = `${title} ${description}`.toLowerCase();
  const reasons = [];
  let score = 0;

  // Check for abusive language
  const abusiveWords = ['fuck', 'shit', 'damn', 'asshole', 'bitch', 'crap'];
  const hasAbuse = abusiveWords.some(word => text.includes(word));
  if (hasAbuse) {
    reasons.push('Contains abusive language');
    score += 0.3;
  }

  // Check for repetitive text (potential spam)
  const words = text.split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;
  if (repetitionRatio < 0.5) {
    reasons.push('Excessive word repetition');
    score += 0.2;
  }

  // Check for very short complaints
  if (text.length < 20) {
    reasons.push('Complaint too short');
    score += 0.1;
  }

  // Check for suspicious contact patterns
  if (!contact.includes('@') && !/^\d{10,}$/.test(contact.replace(/\D/g, ''))) {
    reasons.push('Invalid contact format');
    score += 0.1;
  }

  // Check for generic names
  const genericNames = ['test', 'user', 'anonymous', 'john doe', 'jane doe'];
  if (genericNames.some(g => name.toLowerCase().includes(g))) {
    reasons.push('Generic or test name');
    score += 0.1;
  }

  return {
    isFake: score >= 0.4,
    score: Math.min(score, 1),
    reasons
  };
}

module.exports = { computeComplaintSimilarity, autoCategorizeML, SIMILARITY_THRESHOLD, detectFakeComplaint };
