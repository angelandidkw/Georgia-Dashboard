// Georgia State Roleplay - Cookie Consent
document.addEventListener('DOMContentLoaded', function() {
    // Check if user already accepted cookies
    if (!localStorage.getItem('cookiesAccepted')) {
        // Create cookie consent popup
        const cookieConsent = document.createElement('div');
        cookieConsent.className = 'cookie-consent';
        cookieConsent.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-text">
                    <i class="fas fa-cookie-bite"></i>
                    <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
                </div>
                <div class="cookie-buttons">
                    <button id="accept-cookies" class="cookie-btn accept">Accept</button>
                    <button id="decline-cookies" class="cookie-btn decline">Decline</button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .cookie-consent {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                max-width: 400px;
                background-color: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                font-family: 'Montserrat', sans-serif;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .cookie-content {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .cookie-text {
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }
            
            .cookie-text i {
                font-size: 1.5rem;
                color: #f39c12;
                margin-top: 3px;
            }
            
            .cookie-text p {
                margin: 0;
                font-size: 0.9rem;
                line-height: 1.5;
            }
            
            .cookie-buttons {
                display: flex;
                gap: 10px;
            }
            
            .cookie-btn {
                padding: 8px 15px;
                border: none;
                border-radius: 5px;
                font-family: 'Montserrat', sans-serif;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .cookie-btn.accept {
                background-color: #3498db;
                color: white;
            }
            
            .cookie-btn.accept:hover {
                background-color: #2980b9;
            }
            
            .cookie-btn.decline {
                background-color: transparent;
                color: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .cookie-btn.decline:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            @media (max-width: 480px) {
                .cookie-consent {
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                }
                
                .cookie-text {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                
                .cookie-buttons {
                    flex-direction: column;
                }
            }
        `;
        
        // Add to the document
        document.head.appendChild(style);
        document.body.appendChild(cookieConsent);
        
        // Show the popup with animation
        setTimeout(() => {
            cookieConsent.style.opacity = '1';
            cookieConsent.style.transform = 'translateY(0)';
        }, 1000);
        
        // Handle accept button
        document.getElementById('accept-cookies').addEventListener('click', function() {
            localStorage.setItem('cookiesAccepted', 'true');
            hideCookieConsent();
        });
        
        // Handle decline button
        document.getElementById('decline-cookies').addEventListener('click', function() {
            localStorage.setItem('cookiesDeclined', 'true');
            hideCookieConsent();
        });
        
        // Hide cookie consent with animation
        function hideCookieConsent() {
            cookieConsent.style.opacity = '0';
            cookieConsent.style.transform = 'translateY(20px)';
            setTimeout(() => {
                cookieConsent.remove();
            }, 300);
        }
    }
}); 