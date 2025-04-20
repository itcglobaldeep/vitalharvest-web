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
    
    // Create chat button
    const chatButton = document.createElement('button');
    chatButton.className = 'chat-button';
    chatButton.innerHTML = 'Chat with AI';
    
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.style.display = 'none';
    
    chatButton.addEventListener('click', () => {
        chatContainer.style.display = 
            chatContainer.style.display === 'none' ? 'block' : 'none';
    });
    
    chatWidget.appendChild(chatButton);
    chatWidget.appendChild(chatContainer);
}