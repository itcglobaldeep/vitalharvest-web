class AIChat {
    constructor() {
        this.messages = [];
        this.initializeChat();
    }

    initializeChat() {
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.innerHTML = `
            <div class="chat-header">
                <h3>AI Assistant</h3>
                <button class="close-chat">×</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" placeholder="Type your message...">
                <button class="send-message">Send</button>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const input = document.querySelector('.chat-input input');
        const sendButton = document.querySelector('.send-message');
        const closeButton = document.querySelector('.close-chat');

        sendButton.addEventListener('click', () => this.sendMessage(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage(input.value);
        });
        closeButton.addEventListener('click', () => {
            document.querySelector('.chat-container').style.display = 'none';
        });
    }

    async sendMessage(text) {
        if (!text.trim()) return;

        const input = document.querySelector('.chat-input input');
        input.value = '';

        this.addMessage('user', text);

        try {
            const response = await this.getAIResponse(text);
            this.addMessage('ai', response);
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addMessage(sender, text) {
        const messagesContainer = document.querySelector('.chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async getAIResponse(text) {
        // Placeholder for AI API integration
        return "Thank you for your message. AI integration coming soon!";
    }
}