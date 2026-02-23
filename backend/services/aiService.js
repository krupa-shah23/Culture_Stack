let GoogleGenerativeAI = null;
let genAI = null;

try {
  // require lazily — if the package is not installed we fall back to a no-op implementation
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
  if (process.env.GOOGLE_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
} catch (err) {
  console.warn('@google/generative-ai not available; AI features will be disabled.');
  console.error('Generative AI Load Error:', err);
}



// @desc    Analyze a post and generate AI feedback from multiple personas
// @param   {String} postContent - The content of the post to analyze
// @return  {Object} Object containing feedback from all personas
const analyzePost = async (postContent) => {
  try {
    // If external AI is not configured, use local fallback engine so UI remains functional in dev
    if (!process.env.GOOGLE_API_KEY || !genAI) {
      const { analyzeFallback } = require('./personaEngine');
      return analyzeFallback(postContent);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an expert team of advisors. Analyze the following company reflection post and provide feedback from 3 different personas in JSON format.

Post Content:
"${postContent}"

Provide your response as a valid JSON object with exactly these four fields (keep responses concise, 1-2 sentences each):
{
  "summary": "A concise 5-6 word topic summary of the post (e.g., 'Strategies for Remote Team Alignment')",
  "innovatorFeedback": "Creative ideas to build on this reflection or new perspectives to experiment with",
  "riskEvaluatorFeedback": "Potential risks, downsides, or unintended consequences to consider",
  "strategistFeedback": "Strategic implications and long-term thinking perspective for business impact"
}

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let feedbackData;
    try {
      feedbackData = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    return {
      summary: feedbackData.summary || '',
      innovator: feedbackData.innovatorFeedback || '',
      riskEvaluator: feedbackData.riskEvaluatorFeedback || '',
      strategist: feedbackData.strategistFeedback || ''
    };
  } catch (error) {
    console.error('Error analyzing post with AI:', error.message);
    // Return empty feedback on error to prevent route failure
    return {
      summary: '',
      innovator: '',
      riskEvaluator: '',
      strategist: ''
    };
  }
};

// @desc    Refine raw text (rant) into constructive professional reflection
// @param   {String} rantText - The raw text to refine
// @return  {String} Refined, professional text safe for corporate environment
const refineText = async (rantText) => {
  try {
    // If external AI isn't configured, use a local fallback to keep UX functional
    if (!process.env.GOOGLE_API_KEY || !genAI) {
      const { refineFallback } = require('./personaEngine');
      return refineFallback(rantText);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an expert at transforming raw, emotional feedback into constructive, professional reflections. 
    
Raw text:
"${rantText}"

Rewrite this text to be:
- Constructive and professional
- Safe for a corporate environment
- Focused on solutions and learnings rather than complaints
- Respectful and positive in tone
- While preserving the core concerns and emotions

Return ONLY the refined text, no explanations or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const refinedText = result.response.text().trim();

    return refinedText;
  } catch (error) {
    const fs = require('fs');
    try {
      fs.appendFileSync('./log.txt', 'REFINE ERROR: ' + error + '\n', 'utf8');
      fs.appendFileSync('./log.txt', 'REFINE ERROR MESSAGE: ' + error.message + '\n', 'utf8');
    } catch (e) {
      // ignore
    }
    console.error('Error refining text with AI:', error.message);
    // Return original text on error to prevent route failure
    return rantText;
  }
};

// Helper for retry logic
const generateContentWithRetry = async (model, prompt, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      if ((error.message.includes('503') || error.message.includes('overloaded')) && i < retries - 1) {
        console.warn(`AI 503 Error (Attempt ${i + 1}/${retries}), retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Linear backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error('AI Service Unavailable after retries');
};

// @desc    Generate perspective rewrites from different angles
// @param   {String} postContent - The original post content
// @return  {Object} Object with different perspective rewrites
const generatePerspectives = async (postContent) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return {
        customerPerspective: '',
        competitorPerspective: '',
        newHirePerspective: ''
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert at rewriting reflections from different perspectives. Take this post and rewrite it from 3 different viewpoints.

Original Post:
"${postContent}"

Provide rewrites in JSON format with these fields:
{
  "customerPerspective": "How a customer would view this situation (1-2 sentences)",
  "competitorPerspective": "How a competitor would view this (1-2 sentences)",
  "newHirePerspective": "How a new employee would view this (1-2 sentences)"
}

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let perspectivesData;
    try {
      perspectivesData = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        perspectivesData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse perspectives response');
      }
    }

    return perspectivesData;
  } catch (error) {
    console.error('Error generating perspectives:', error.message);
    return {
      customerPerspective: '',
      competitorPerspective: '',
      newHirePerspective: ''
    };
  }
};

// @desc    Analyze sentiment of text
// @param   {String} text - The text to analyze
// @return  {Object} Sentiment analysis with score and label
const analyzeSentiment = async (text) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return {
        sentiment: 'neutral',
        score: 0.5,
        emotions: []
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze the sentiment of this text. Respond in JSON format.

Text: "${text}"

Provide sentiment analysis with:
{
  "sentiment": "positive|negative|neutral|mixed",
  "score": 0.0-1.0 where 0 is very negative, 0.5 is neutral, 1.0 is very positive,
  "emotions": ["emotion1", "emotion2", "emotion3"] - top emotions detected,
  "explanation": "Brief explanation of the sentiment"
}

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let sentimentData;
    try {
      sentimentData = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentimentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse sentiment response');
      }
    }

    return sentimentData;
  } catch (error) {
    console.error('Error analyzing sentiment:', error.message);
    return {
      sentiment: 'neutral',
      score: 0.5,
      emotions: []
    };
  }
};

// @desc    Scrub identifying information from text for anonymity
// @param   {String} text - The text to anonymize
// @return  {String} Scrubbed text with identifying info removed
const scrubAnonymity = async (text) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return text;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert at removing identifying information from text while preserving meaning and context.

Original text:
"${text}"

Remove or generalize identifying information such as:
- Names (replace with generic descriptions like "a colleague" or "a team member")
- Specific projects or internal initiatives
- Department or role references that could identify individuals
- Time-specific details that narrow down to individuals
- Personal details or habits that could identify someone

Keep the core message and emotional tone intact.
Return ONLY the scrubbed text, no explanations or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const scrubbedText = result.response.text().trim();

    return scrubbedText;
  } catch (error) {
    console.error('Error scrubbing anonymity:', error.message);
    return text;
  }
};

// @desc    Generate context relations - find thematically related past posts
// @param   {String} currentText - The current post text
// @param   {Array} pastPostTitles - Array of past post titles from the org
// @return  {Array} Array of related post indices/keywords
const generateContextRelations = async (currentText, pastPostTitles = []) => {
  try {
    if (!process.env.GOOGLE_API_KEY || pastPostTitles.length === 0) {
      return [];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const pastPostsList = pastPostTitles.map((title, idx) => `${idx}: ${title}`).join('\n');

    const prompt = `Analyze this post and find related topics from past posts.

Current Post:
"${currentText}"

Past Posts:
${pastPostsList}

Find the most relevant past posts that are thematically or contextually related to the current post. Return a JSON array of related post indices (0-based) and their relevance scores:

[
  { "index": 0, "relevance": 0.95, "reason": "Discusses similar topic" },
  { "index": 2, "relevance": 0.78, "reason": "Related to process improvement" }
]

Maximum 5 related posts. Return ONLY the JSON array, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let relatedPosts;
    try {
      relatedPosts = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        relatedPosts = JSON.parse(jsonMatch[0]);
      } else {
        return [];
      }
    }

    return relatedPosts;
  } catch (error) {
    console.error('Error generating context relations:', error.message);
    return [];
  }
};

// @desc    Generate a concise summary of the podcast
// @param   {String} text - The transcription text
// @return  {String} The generated summary
const summarizeText = async (text) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return "Summary unavailable (AI key missing).";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Summarize the following podcast transcript into a concise, engaging paragraph (approx. 3-4 sentences). Capture the main topic, key insights, and the general vibe of the conversation.

Transcript: "${text.substring(0, 15000)}" 

Return ONLY the summary text.`;

    const result = await generateContentWithRetry(model, prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating summary:', error.message);
    return "Summary generation failed: " + error.message;
  }
};

// @desc    Generate heatmap data (sentiment over time)
// @param   {String} text - The transcription text
// @return  {Array} Array of sentiment blocks { start, end, sentiment, score }
const generateHeatmapData = async (text) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return Array(10).fill({ sentiment: 'neutral', score: 0.5 }); // Dummy data
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Approximate timeline by splitting text into 10 chunks
    // A real implementation would use timestamps from the transcription, but Gemini simple transcription 
    // doesn't give per-word timestamps easily in the current mode.
    // So we'll split the text into equal parts to represent the "flow" of the podcast.

    const chunkSize = Math.ceil(text.length / 10);
    const chunks = [];
    for (let i = 0; i < 10; i++) {
      chunks.push(text.substring(i * chunkSize, (i + 1) * chunkSize));
    }

    const heatmapData = [];

    // Analyze chunks in parallel (limited) or sequence
    // For speed/simplicity, we'll do a single prompt for all chunks if possible, or just a few key points.
    // Better approach: Ask Gemini to analyze the "emotional arc" of the text and return 10 data points.

    const prompt = `Analyze the emotional arc of this podcast transcript. Divide the content into 10 sequential time segments. 
    For each segment, determine the dominant sentiment (Excited, Neutral, Tense, Happy, Sad, Angry) and an intensity score (0.0 to 1.0).

    Transcript: "${text.substring(0, 20000)}"

    Return a JSON array of exactly 10 objects:
    [
      { "segment": 1, "sentiment": "Neutral", "score": 0.5 },
      { "segment": 2, "sentiment": "Excited", "score": 0.8 }
      ...
    ]
    Return ONLY the JSON array.`;

    const result = await generateContentWithRetry(model, prompt);
    const responseText = result.response.text();

    let data;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      // Fallback
      return Array(10).fill({ sentiment: 'neutral', score: 0.5 });
    }

    return data;

  } catch (error) {
    console.error('Error generating heatmap:', error.message);
    return Array(10).fill({ sentiment: 'neutral', score: 0.5 });
  }
};

module.exports = { analyzePost, refineText, generatePerspectives, analyzeSentiment, scrubAnonymity, generateContextRelations, summarizeText, generateHeatmapData };