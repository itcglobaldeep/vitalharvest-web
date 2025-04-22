// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initializeNavigation();
    initializeChatWidget();
});

function initializeNavigation() {
    const nav = document.querySelector('nav');
    
    // Add scroll effect to navigation
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

function initializeChatWidget() {
    const chatWidget = document.getElementById('ai-chat-widget');
    if (!chatWidget) {
        console.error('Chat widget element not found!');
        return;
    }
    
    // Create chat interface HTML
    const chatInterface = `
        <div class="chat-container">
            <div class="chat-header">
                <span class="chat-title">AI Assistant</span>
                <div class="chat-controls">
                    <button class="minimize-chat">−</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" id="user-message" placeholder="Type your message...">
                <button id="send-message">Send</button>
            </div>
        </div>
    `;
    
    chatWidget.innerHTML = chatInterface;
    
    // Initialize DOM elements after creating interface
    const sendButton = document.getElementById('send-message');
    const userInput = document.getElementById('user-message');
    const messagesContainer = document.querySelector('.chat-messages');
    
    // Add event listeners
    if (sendButton && userInput) {
        sendButton.addEventListener('click', () => {
            const message = userInput.value.trim();
            if (message) sendMessage(message);
        });

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = userInput.value.trim();
                if (message) sendMessage(message);
            }
        });
    }
    
    console.log('Chat widget found:', chatWidget);
    
    // Add basic styling to make widget visible
    chatWidget.style.position = 'fixed';
    chatWidget.style.bottom = '20px';
    chatWidget.style.right = '20px';
    chatWidget.style.backgroundColor = '#fff';
    chatWidget.style.border = '1px solid #ccc';
    chatWidget.style.zIndex = '1000';
    
    console.log('Initializing chat widget...');
    
    // Add welcome message and initial state
    const initialState = {
        isMinimized: false,
        messages: []
    };

    // Test message to verify chat is working
    setTimeout(() => {
        addMessageToChat('bot', 'Hello! I am your AI assistant. How can I help you today?');
    }, 1000);

    // Add debug logging to message sending
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        console.log('Sending message:', message);
        addMessageToChat('user', message);
        userInput.value = '';
        typingIndicator.style.display = 'block';

        // Test API connection
        fetch('/api/analyze/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        })
        .then(response => {
            console.log('API Response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Processed data:', data);
            typingIndicator.style.display = 'none';
            addMessageToChat('bot', data.data.content);
        })
        .catch(error => {
            console.error('API Error:', error);
            typingIndicator.style.display = 'none';
            addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.');
        });
    }

    // Test file upload functionality
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name, file.type);
            const reader = new FileReader();
            reader.onload = function(e) {
                const imagePreview = `<img src="${e.target.result}" alt="Uploaded Image" style="max-width: 200px;">`;
                addMessageToChat('user', imagePreview, true);
                
                // Send image to backend
                fetch('/api/analyze/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        imageUrl: e.target.result,
                        type: 'object'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    typingIndicator.style.display = 'none';
                    addMessageToChat('bot', data.data.content);
                })
                .catch(error => {
                    typingIndicator.style.display = 'none';
                    addMessageToChat('bot', 'Sorry, I could not process the image.');
                });
            };
            reader.readAsDataURL(file);
        }
    }

    // Add debug logging for DOM elements
    console.log('Send button:', document.getElementById('send-message'));
    console.log('User input:', document.getElementById('user-message'));
    console.log('Messages container:', document.querySelector('.chat-messages'));
    console.log('Chat container:', document.querySelector('.chat-container'));

    // Add error boundary to message handling
    function addMessageToChat(sender, message, isHTML = false) {
        try {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${sender}-message`;
            if (isHTML) {
                messageElement.innerHTML = message;
            } else {
                messageElement.textContent = message;
            }
            const container = document.querySelector('.chat-messages');
            if (!container) {
                throw new Error('Messages container not found');
            }
            container.appendChild(messageElement);
            container.scrollTop = container.scrollHeight;
            console.log('Message added:', { sender, message });
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }
}