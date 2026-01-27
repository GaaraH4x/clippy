const axios = require('axios');

async function generateSummary(messages, hfToken) {
  if (!messages || messages.length === 0) {
    return "No significant activity today.";
  }

  // Combine messages into text for summarization
  const chatText = messages
    .map(m => m.message_text)
    .filter(text => text && text.length > 10)
    .join(' ');

  if (chatText.length < 50) {
    return "Light activity today with brief conversations.";
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        inputs: chatText.slice(0, 1000), // Limit to 1000 chars for free tier
        parameters: {
          max_length: 100,
          min_length: 30
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data[0] && response.data[0].summary_text) {
      return response.data[0].summary_text;
    }

    return "Community discussions continued around ClipCash development and engagement.";
  } catch (error) {
    console.error('Summary generation error:', error.message);
    // Fallback: Return most reacted message as summary
    const topMessage = messages.sort((a, b) => b.reactions - a.reactions)[0];
    return topMessage?.message_text || "Active discussions in the community today.";
  }
}

module.exports = { generateSummary };