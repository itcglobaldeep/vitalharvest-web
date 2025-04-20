const openai = require('openai');

class AIController {
    constructor() {
        this.openai = new openai({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateResponse(prompt) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error('AI Response Error:', error);
            throw new Error('Failed to generate AI response');
        }
    }
}

module.exports = new AIController();