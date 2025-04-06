// Auth check and user data loading
document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Create a fallback image - using a proper URL instead of data URI
    // Use placeholder.jpg as fallback, with further fallback to a basic color
    const setPlaceholderImage = (img) => {
        img.onerror = function() {
            // If the main placeholder fails, use a basic background color
            this.onerror = null; // Prevent infinite loop
            this.style.backgroundColor = '#cccccc';
            this.style.height = '100%';
            this.style.width = '100%';
            this.alt = 'Image not available';
        };
        // Try to use a simple colored background instead of trying to load a file
        img.style.backgroundColor = '#3498db';
        img.style.height = '100%';
        img.style.width = '100%';
        img.alt = 'Image not available';
        // Remove src to prevent further loading attempts
        img.removeAttribute('src');
    };
    
    // Set the placeholder for all images that fail to load
    document.querySelectorAll('.card-image img').forEach(img => {
        img.onerror = function() {
            setPlaceholderImage(this);
        };
    });
    
    // Initialize loading overlay
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 300);
    }
    
    // Setup navigation for cards using event delegation
    document.addEventListener('click', function(e) {
        // Use event delegation to handle card clicks efficiently
        let target = e.target;
        
        // Find if we clicked on a card or one of its child elements
        while (target && !target.classList.contains('navigable-card') && target !== document.body) {
            target = target.parentElement;
        }
        
        // If we found a card, navigate to its URL
        if (target && target.classList.contains('navigable-card')) {
            const url = target.dataset.url;
            if (url) {
                window.location.href = url;
            }
        }
    });
    
    // Create custom notification element to replace alert
    const showNotification = (message) => {
        // Remove any existing notifications
        const existingNotification = document.getElementById('custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.id = 'custom-notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        notification.style.transition = 'opacity 0.3s ease';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    };
    
    // Fetch user data from API
    fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.loggedIn && data.user) {
            // Update all username elements with the actual username
            const usernameElements = document.querySelectorAll('.username');
            usernameElements.forEach(element => {
                element.textContent = data.user.username || 'User';
            });
            
            // Update avatar if available
            if (data.user.avatar) {
                const avatarImg = document.querySelector('.user-avatar');
                avatarImg.onerror = function() {
                    this.src = '/images/default-avatar.png';
                };
                avatarImg.src = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`;
            }
            
            // Initialize all card images that couldn't load
            document.querySelectorAll('.card-image img').forEach(img => {
                if (!img.complete || img.naturalHeight === 0) {
                    setPlaceholderImage(img);
                }
            });
        } else {
            console.log('User not logged in, redirecting to auth...');
            window.location.href = '/auth/discord?returnTo=/panels/community.html';
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'auth-error';
        errorMsg.innerHTML = `
            <p>Failed to load user data. Please try again.</p>
            <button id="retryAuth" class="retry-button">Login with Discord</button>
        `;
        document.querySelector('.main-content').prepend(errorMsg);
        
        document.getElementById('retryAuth').addEventListener('click', function() {
            window.location.href = '/auth/discord?returnTo=/panels/community.html';
        });
    });
    

}); 