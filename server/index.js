const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: `As a wellness assistant for VitalHarvest, respond to: ${message}`,
      max_tokens: 150,
      temperature: 0.7,
    });

    res.json({ message: completion.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});