// Add a special comment marker to verify this file loads correctly
// DEBUG: JavaScript file loaded successfully
console.log('Script loaded successfully at: ' + new Date().toISOString());

// Georgia State Roleplay - Coming Soon
console.log('Georgia State Roleplay - Coming Soon!');

// Initialize website features
document.addEventListener('DOMContentLoaded', function() {
    // Check for error parameters in URL and redirect to error page
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
        // Redirect to the specialized auth-error page
        window.location.href = '/auth-error.html?error=' + error;
        return;
    }
    
    // Add subtle animation to the logo
    const logo = document.querySelector('.logo h1');
    if (logo) {
        logo.style.transition = 'text-shadow 0.5s ease';
        logo.addEventListener('mouseover', function() {
            this.style.textShadow = '0 0 10px rgba(52, 152, 219, 0.8), 0 0 20px rgba(52, 152, 219, 0.5)';
        });
        logo.addEventListener('mouseout', function() {
            this.style.textShadow = '2px 2px 8px rgba(0, 0, 0, 0.5)';
        });
    }
    
    // Enhance auth button with hover effect
    const authButton = document.querySelector('.auth-button');
    if (authButton) {
        authButton.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 7px 14px rgba(0, 0, 0, 0.25)';
        });
        authButton.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    }
    
    // Add dynamic background effect
    const container = document.querySelector('.container');
    if (container) {
        document.addEventListener('mousemove', function(e) {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            document.body.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
        });
    }
    
    // Add visual feedback when clicking on social icons
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            // Add pulse animation
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'pulse 0.5s';
            }, 10);
        });
    });
});

// Define pulse animation if not in CSS
if (!document.querySelector('style#dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Preload transition for smoother page navigation
window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '0.5';
    document.body.style.transition = 'opacity 0.3s ease';
}); 