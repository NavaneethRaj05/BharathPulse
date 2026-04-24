const { autoCategorizeML } = require('../utils/similarity');

const extractLocation = (message) => {
  const match = message.match(/(?:at|near|in)\s+([a-z0-9 ,.-]{3,})/i);
  return match ? match[1].trim() : '';
};

const toSentenceCase = (value) => {
  if (!value) return '';
  const text = String(value).trim().replace(/\s+/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const buildTitle = (text, category) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  const intentMap = {
    Roads: 'Road damage and safety issue reported',
    Sanitation: 'Sanitation and waste management complaint',
    'Water Department': 'Water supply issue reported',
    Electrical: 'Electricity and streetlight issue reported',
    General: 'Civic infrastructure complaint reported',
  };
  if (clean.length < 20) return intentMap[category] || intentMap.General;
  return toSentenceCase(clean.slice(0, 70));
};

const detectPriority = (text) => {
  const urgent = ['accident', 'injury', 'danger', 'urgent', 'emergency', 'fire', 'electrocution'];
  const high = ['no water', 'major leak', 'blackout', 'sewage overflow', 'large pothole'];
  const lower = text.toLowerCase();
  if (urgent.some((word) => lower.includes(word))) return 'Critical';
  if (high.some((word) => lower.includes(word))) return 'High';
  return 'Normal';
};

const buildEnhancedDescription = (message, category, location, priority) => {
  const issue = toSentenceCase(message);
  const locationLine = location ? `Location mentioned by citizen: ${toSentenceCase(location)}.` : 'Location details were not clearly provided.';
  return [
    `Citizen reported the following issue: ${issue}.`,
    `Category inferred by chatbot: ${category}.`,
    `Priority assessment: ${priority}.`,
    locationLine,
    'Please verify exact landmark, impact area, and frequency during field inspection.',
  ].join(' ');
};

const buildMissingDetails = (message, location) => {
  const lower = message.toLowerCase();
  const questions = [];
  if (!location) questions.push('Share exact landmark or street name.');
  if (!/\d/.test(lower)) questions.push('Mention affected area size/number (e.g., 2 streets, 50 homes).');
  if (!/(since|from|days|hours|week)/.test(lower)) questions.push('Mention when the issue started.');
  return questions;
};

const parseChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const normalized = String(message).trim();
    const { category, confidence } = autoCategorizeML(normalized);
    const location = extractLocation(normalized);
    const priority = detectPriority(normalized);
    const title = buildTitle(normalized, category);
    const enhancedDescription = buildEnhancedDescription(normalized, category, location, priority);
    const missingDetails = buildMissingDetails(normalized, location);
    const suggestedContactMode = /\d{10}/.test(normalized) ? 'phone' : 'email_or_phone';

    return res.status(200).json({
      success: true,
      data: {
        title,
        description: enhancedDescription,
        originalText: normalized,
        category,
        confidence,
        location,
        priority,
        missingDetails,
        suggestedContactMode,
        botReply: `I converted your message into a structured ${category} complaint${location ? ` near ${location}` : ''} with ${priority.toLowerCase()} priority. Review and submit.`,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const FAQ_KB = [
  {
    keywords: ['track', 'status', 'where', 'progress'],
    answer: 'You can track a complaint from the Track Complaint page using your complaint ID.',
  },
  {
    keywords: ['complaint id', 'tracking id', 'id'],
    answer: 'After submission, you get a complaint ID. Save or copy it to check status later.',
  },
  {
    keywords: ['duplicate', 'merged', 'same issue'],
    answer: 'If a similar complaint already exists, the system merges reports to avoid duplicates and increase priority visibility.',
  },
  {
    keywords: ['photo', 'image', 'evidence', 'upload'],
    answer: 'You can upload an optional image as evidence. Keep the file size within 5MB for a successful upload.',
  },
  {
    keywords: ['department', 'category', 'route'],
    answer: 'The AI categorizes complaints (Roads, Water, Electrical, Sanitation, etc.) and routes them to the relevant department.',
  },
  {
    keywords: ['contact', 'email', 'phone'],
    answer: 'Provide your contact info during submission so officials can follow up when needed.',
  },
];

const fallbackFaq =
  'I can help with FAQs about complaint submission, tracking IDs, status updates, duplicate merging, categories, and evidence uploads.';

const parseFaqMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const normalized = String(message).toLowerCase();
    const bestMatch = FAQ_KB.find((item) => item.keywords.some((word) => normalized.includes(word)));

    return res.status(200).json({
      success: true,
      data: {
        answer: bestMatch ? bestMatch.answer : fallbackFaq,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { parseChatMessage, parseFaqMessage };
