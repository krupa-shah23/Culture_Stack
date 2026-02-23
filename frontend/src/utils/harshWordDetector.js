// Harsh word detection utility

const HARSH_WORDS = {
  // Profanity and strong language
  severe: [
    "damn", "hell", "crap", "sucks", "suck", "stupid", "idiot", 
    "dumb", "moron", "asshole", "jerk", "bastard", "racist", "liar",
    "disgusting", "hate", "hated", "hating", "pathetic", "useless",
    "worthless", "incompetent", "fraud", "scam", "corrupt", "evil"
  ],
  moderate: [
    "bad", "awful", "terrible", "horrible", "disgusted", "angry", 
    "furious", "frustrated", "annoyed", "irritated", "pissed", "upset",
    "disappointed", "ashamed", "embarrassed", "disrespect", "insult",
    "worst", "worst", "fail", "failed", "failing", "trash", "garbage"
  ]
};

const calculateHarshScore = (text) => {
  if (!text || text.trim().length === 0) {
    return { score: 0, intensity: "safe", count: 0, words: [] };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let severeCount = 0;
  let moderateCount = 0;
  const foundWords = [];

  // Check for harsh words
  HARSH_WORDS.severe.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex) || [];
    if (matches.length > 0) {
      severeCount += matches.length;
      foundWords.push({ word, severity: "severe", count: matches.length });
    }
  });

  HARSH_WORDS.moderate.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex) || [];
    if (matches.length > 0) {
      moderateCount += matches.length;
      foundWords.push({ word, severity: "moderate", count: matches.length });
    }
  });

  // Calculate overall score (0-1)
  const totalHarshWords = severeCount * 2 + moderateCount; // Severe words weighted 2x
  const score = Math.min(totalHarshWords / words.length * 10, 1.0);

  // Determine intensity
  let intensity = "safe";
  if (score >= 0.7) {
    intensity = "harsh";
  } else if (score >= 0.4) {
    intensity = "moderate";
  } else if (score > 0) {
    intensity = "caution";
  }

  return {
    score: parseFloat(score.toFixed(2)),
    intensity,
    count: severeCount + moderateCount,
    words: foundWords.slice(0, 5), // Return top 5 harsh words
  };
};

export { calculateHarshScore };
