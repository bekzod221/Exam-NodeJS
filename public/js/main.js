// Main JavaScript for AutoLux
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication state
    initAuth();
    
    // Initialize cart functionality
    initCart();
    
    // Initialize logout functionality
    initLogout();
});

// Authentication functions
function initAuth() {
    // Check if user is logged in by making a request to check auth status
    checkAuthStatus();
}

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                updateUIForLoggedInUser(data.user);
            } else {
                updateUIForLoggedOutUser();
            }
        } else {
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser(user) {
    // Update navigation
    const nav = document.querySelector('nav');
    if (nav) {
        // Show user-specific links
        const userLinks = nav.querySelectorAll('.user-only');
        userLinks.forEach(link => link.style.display = 'inline');
        
        // Hide guest-only links
        const guestLinks = nav.querySelectorAll('.guest-only');
        guestLinks.forEach(link => link.style.display = 'none');
        
        // Update user name if there's a user name element
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
    }
    
    // Enable cart functionality
    enableCartFeatures();
}

function updateUIForLoggedOutUser() {
    // Update navigation
    const nav = document.querySelector('nav');
    if (nav) {
        // Hide user-specific links
        const userLinks = nav.querySelectorAll('.user-only');
        userLinks.forEach(link => link.style.display = 'none');
        
        // Show guest-only links
        const guestLinks = nav.querySelectorAll('.guest-only');
        guestLinks.forEach(link => link.style.display = 'inline');
    }
    
    // Disable cart functionality
    disableCartFeatures();
}

// Cart functions
function initCart() {
    // Load cart count on page load
    loadCartCount();
}

async function loadCartCount() {
    try {
        const response = await fetch('/api/cart', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                updateCartCount(data.data.totalItems || 0);
            }
        }
    } catch (error) {
        console.error('Error loading cart count:', error);
    }
}

function updateCartCount(count) {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? 'flex' : 'none';
    }
}

function enableCartFeatures() {
    // Enable add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .quick-add-btn');
    addToCartButtons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
    });
}

function disableCartFeatures() {
    // Disable add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .quick-add-btn');
    addToCartButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
    });
}

// Logout functions
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Clear cart count
            updateCartCount(0);
            
            // Update UI for logged out user
            updateUIForLoggedOutUser();
            
            // Redirect to home page
            window.location.href = '/';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Global add to cart function
window.addToCart = async function(carId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ carId, quantity: 1 })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Vehicle added to cart successfully!', 'success');
            
            // Update cart count
            const currentCount = parseInt(document.getElementById('cartCount')?.textContent || '0');
            updateCartCount(currentCount + 1);
        } else {
            showNotification(result.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add to cart', 'error');
    }
};

// Global notification function
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
};

// Global bookmark function
window.toggleBookmark = async function(carId) {
    try {
        const response = await fetch('/api/bookmarks/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ carId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (result.data.isBookmarked) {
                showNotification('Added to favorites!', 'success');
            } else {
                showNotification('Removed from favorites', 'info');
            }
        } else {
            showNotification(result.message || 'Failed to update favorites', 'error');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showNotification('Failed to update favorites', 'error');
    }
};
