const { analyzePost } = require('./services/aiService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const content = "Listen, we need to talk about the absolute audacity of fitted sheets. The Great Deception You start with such optimism. You find the first corner—click—it’s perfect. You find the second corner. It’s ...";

const test = async () => {
  console.log('Testing analyzePost with content:', content);
  try {
    const result = await analyzePost(content);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
};

test();
