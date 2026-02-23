// Lightweight local fallback for AI personas and text refinement.
// Used when external AI (Google Generative) is not configured.

const sanitize = (text) => {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\!{2,}/g, '!')
    .replace(/\s+\!/g, '!')
    .trim();
};

const sentenceCase = (s) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const summarize = (text) => {
  const t = sanitize(text);
  const firstSentenceMatch = t.match(/[^\.\!\?]+[\.\!\?]/);
  let summary = firstSentenceMatch ? firstSentenceMatch[0].trim() : t;
  // Enforce max length approx 10-12 words
  const words = summary.split(' ');
  if (words.length > 12) {
    return words.slice(0, 12).join(' ') + '...';
  }
  return summary;
};

const refineFallback = (rant) => {
  let t = sanitize(rant);

  // Replace strong/abusive words with softer equivalents
  t = t.replace(/\b(hate|terrible|stupid|idiot|damn)\b/gi, (m) => {
    const map = { hate: 'strongly dislike', terrible: 'concerning', stupid: 'not effective', idiot: 'uninformed', damn: '' };
    return map[m.toLowerCase()] || m;
  });

  // Convert all-caps to sentence case
  if (t === t.toUpperCase()) t = sentenceCase(t);

  // Replace accusatory "you" patterns with observations
  t = t.replace(/\bYou always\b/gi, 'I have observed that');
  t = t.replace(/\bYou never\b/gi, 'I have noticed that we rarely');

  // Turn imperative complaints into constructive suggestions
  t = t.replace(/\bWe need to stop\b/gi, 'I suggest we consider stopping');
  t = t.replace(/\bWe should\b/gi, 'I recommend we');

  // Ensure it reads like a reflection: add a lead and an actionable closing if missing
  if (!/^I\b|^My\b|^We\b/i.test(t)) {
    t = 'I noticed that ' + t.charAt(0).toLowerCase() + t.slice(1);
  }

  if (!/(suggest|recommend|could|should)/i.test(t)) {
    t = t + ' I would suggest discussing possible improvements and next steps.';
  }

  return sentenceCase(t);
};

const analyzeFallback = (postContent) => {
  const summary = summarize(postContent);
  const base = sanitize(postContent).substring(0, 200);

  // Simple heuristic-based persona responses
  return {
    summary,
    mentor: `Appreciate the reflection — this highlights the core issue and shows willingness to improve.`,
    critic: `Consider clarifying the root cause and providing data; the current description is a bit high-level.`,
    strategist: `Think about long-term implications and align proposed changes with strategic priorities.`,
    executionManager: `Break this into a 2–3 step action plan with owners and timelines.`,
    riskEvaluator: `Potential risks include team morale and delivery delays; mitigate by piloting changes.`,
    innovator: `Explore a small experiment to test alternatives and measure impact.`
  };
};

module.exports = { refineFallback, analyzeFallback };