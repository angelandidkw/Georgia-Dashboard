// News Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize news filtering
    initializeNewsFilters();
    // Initialize search functionality
    initializeNewsSearch();
    // Initialize pagination
    initializePagination();
});

// News Filtering
function initializeNewsFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const newsCards = document.querySelectorAll('.news-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            
            // Filter news cards
            newsCards.forEach(card => {
                if (filter === 'all' || card.querySelector('.card-category').textContent.toLowerCase() === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// News Search
function initializeNewsSearch() {
    const searchInput = document.getElementById('newsSearch');
    const newsCards = document.querySelectorAll('.news-card');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        newsCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const category = card.querySelector('.card-category').textContent.toLowerCase();

            if (title.includes(searchTerm) || 
                description.includes(searchTerm) || 
                category.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Pagination
function initializePagination() {
    const pageButtons = document.querySelectorAll('.page-btn');
    const newsGrid = document.querySelector('.news-grid');
    const itemsPerPage = 6;
    let currentPage = 1;

    pageButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;

            // Update active state
            pageButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Handle pagination
            if (button.querySelector('.fa-chevron-left')) {
                if (currentPage > 1) {
                    currentPage--;
                    updatePagination();
                }
            } else if (button.querySelector('.fa-chevron-right')) {
                if (currentPage < 3) { // Assuming 3 pages total
                    currentPage++;
                    updatePagination();
                }
            } else {
                currentPage = parseInt(button.textContent);
                updatePagination();
            }
        });
    });

    function updatePagination() {
        // Update button states
        const prevButton = document.querySelector('.fa-chevron-left').parentElement;
        const nextButton = document.querySelector('.fa-chevron-right').parentElement;

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === 3; // Assuming 3 pages total

        // Here you would typically fetch new content for the current page
        // For now, we'll just log the page change
        console.log(`Loading page ${currentPage}`);
    }
}

// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('.card-image img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        if (img.dataset.src) {
            imageObserver.observe(img);
        }
    });
}

// Initialize lazy loading
initializeLazyLoading(); 