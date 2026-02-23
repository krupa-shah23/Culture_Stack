const { AssemblyAI } = require('assemblyai');
const fs = require('fs');

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || '5f1824e9ae264919b1987f203a6b78e9'
});

// @desc    Transcribe audio file using AssemblyAI
// @param   {String} filePath - Path to the local audio file
// @return  {Object} Transcription result with summary and sentiment
const transcribeAudio = async (filePath) => {
  try {
    console.log('Starting AssemblyAI transcription for file:', filePath);

    // 1. Upload the file first
    const uploadUrl = await client.files.upload(filePath);
    console.log('File uploaded to AssemblyAI:', uploadUrl);

    const params = {
      audio: uploadUrl, // Use the upload URL
      summarization: true,
      summary_model: 'informative',
      summary_type: 'bullets',
      sentiment_analysis: true,
      speech_models: ['universal-2']
    };

    const transcript = await client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      throw new Error(transcript.error);
    }

    return formatAssemblyResult(transcript);
  } catch (error) {
    console.error('AssemblyAI Transcription Error:', error);
    // Return a fallback structure so the app doesn't crash, but with error info
    return {
      text: `[Transcription error: ${error.message}]`,
      confidence: 0,
      words: [],
      summary: "Summary unavailable due to transcription error.",
      heatmap: []
    };
  }
};

// @desc    Transcribe audio from URL using AssemblyAI
// @param   {String} audioUrl - Public URL of the audio file
// @return  {Object} Transcription result
const transcribeAudioFromUrl = async (audioUrl) => {
  try {
    console.log('Starting AssemblyAI transcription for URL:', audioUrl);

    const params = {
      audio: audioUrl,
      summarization: true,
      summary_model: 'informative',
      summary_type: 'bullets',
      sentiment_analysis: true,
      speech_models: ['universal-2']
    };

    const transcript = await client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      throw new Error(transcript.error);
    }

    return formatAssemblyResult(transcript);
  } catch (error) {
    console.error('AssemblyAI URL Transcription Error:', error);
    return {
      text: `[Transcription error: ${error.message}]`,
      confidence: 0,
      words: [],
      summary: "Summary unavailable due to transcription error.",
      heatmap: []
    };
  }
};

// Helper to format AssemblyAI response to our app's expected structure
const formatAssemblyResult = (transcript) => {
  // 1. Text
  const text = transcript.text;

  // 2. Confidence (average)
  const confidence = transcript.confidence;

  // 3. Words
  const words = transcript.words.map(w => ({
    word: w.text,
    startTime: w.start,
    endTime: w.end,
    confidence: w.confidence
  }));

  // 4. Summary
  const summary = transcript.summary;

  // 5. Heatmap (Sentiment)
  // AssemblyAI returns sentiment for sentences. We need to map this to a "timeline".
  // We'll normalize the timeline into 10 segments for the UI heatmap.

  let heatmap = [];
  if (transcript.sentiment_analysis_results) {
    heatmap = processSentimentToHeatmap(transcript.sentiment_analysis_results, transcript.audio_duration);
  }

  return {
    text,
    confidence,
    words,
    summary,
    heatmap
  };
};

// Convert AssemblyAI sentiment sentences into 10 equal time segments
const processSentimentToHeatmap = (sentimentResults, duration) => {
  if (!duration || duration <= 0) return Array(10).fill({ sentiment: 'neutral', score: 0.5 });

  const segmentDuration = duration / 10;
  const heatmap = [];

  for (let i = 0; i < 10; i++) {
    const startTime = i * segmentDuration * 1000; // ms
    const endTime = (i + 1) * segmentDuration * 1000; // ms

    // Find sentences that overlap with this segment
    const segmentSentences = sentimentResults.filter(s =>
      (s.start <= endTime && s.end >= startTime)
    );

    if (segmentSentences.length === 0) {
      heatmap.push({ segment: i + 1, sentiment: 'neutral', score: 0.5 });
      continue;
    }

    // Calculate dominant sentiment
    let pos = 0, neg = 0, neu = 0;
    segmentSentences.forEach(s => {
      if (s.sentiment === 'POSITIVE') pos += s.confidence;
      if (s.sentiment === 'NEGATIVE') neg += s.confidence;
      if (s.sentiment === 'NEUTRAL') neu += s.confidence;
    });

    let sentiment = 'Neutral';
    let paramScore = 0.5;

    // Simple logic to map POSITIVE/NEGATIVE to our UI's Excited/Tense/etc.
    if (pos > neg && pos > neu) {
      sentiment = 'Excited'; // Mapping Positive -> Excited for UI
      paramScore = 0.8;
    } else if (neg > pos && neg > neu) {
      sentiment = 'Tense'; // Mapping Negative -> Tense for UI
      paramScore = 0.2;
    }

    heatmap.push({
      segment: i + 1,
      sentiment: sentiment,
      score: paramScore
    });
  }

  return heatmap;
};

module.exports = {
  transcribeAudio,
  transcribeAudioFromUrl
};
