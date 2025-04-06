// Remove loading overlay when page is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 500);
    }

    // Fetch user data from API
    fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.loggedIn && data.user) {
            // Update username
            const usernameElements = document.querySelectorAll('.username');
            usernameElements.forEach(element => {
                element.textContent = data.user.username || 'User';
            });
            
            // Update avatar if available
            if (data.user.avatar) {
                const avatarUrl = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`;
                document.querySelector('.user-avatar').src = avatarUrl;
            }
        } else {
            // User is not logged in, redirect to Discord auth
            window.location.href = '/auth/discord?returnTo=/panels/community';
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
    });
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to current navigation item
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.community-nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}); 