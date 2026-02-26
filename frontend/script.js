const API_URL = 'http://localhost:5000/api';

let currentUser = null;
let currentAuthTab = 'login';
let selectedRating = 0;
let selectedTags = [];
let allTags = [];

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

function getMediaEmoji(type) {
    const emojis = {
        book: '📚',
        movie: '🎬',
        tv: '📺',
        music: '🎵',
        game: '🎮'
    };
    return emojis[type] || '📌';
}

function getInitial(username) {
    return username ? username.charAt(0).toUpperCase() : 'U';
}

function renderStars(rating) {
    if (!rating) return '';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function renderReviewCard(review) {
    const tags = review.tags ? review.tags.split(',') : [];
    const reactions = review.reactions || { heart: 0, laughing: 0, crying: 0, surprised: 0 };
    const userReactions = review.userReactions || [];
    
    const tagsHtml = tags.map(tag => `<span class="review-tag ${tag.trim()}">#${tag.trim()}</span>`).join('');
    
    return `
        <div class="review-card" data-id="${review.id}">
            <div class="review-header">
                <div class="review-user">
                    <div class="user-avatar-small">${getInitial(review.username)}</div>
                    <span class="username">${review.username}</span>
                    <span class="review-date">${formatDate(review.created_at)}</span>
                </div>
                <span class="media-type-badge ${review.media_type}">${getMediaEmoji(review.media_type)} ${review.media_type}</span>
            </div>
            <div class="media-title">${review.media_title}</div>
            ${review.rating ? `<div class="rating">${renderStars(review.rating)}</div>` : ''}
            <div class="review-text">"${review.review_text}"</div>
            ${tagsHtml ? `<div class="review-tags">${tagsHtml}</div>` : ''}
            <div class="review-reactions">
                <button class="reaction-btn ${userReactions.includes('heart') ? 'active heart' : ''}" data-emoji="heart">
                    ❤️ <span>${reactions.heart || 0}</span>
                </button>
                <button class="reaction-btn ${userReactions.includes('laughing') ? 'active laughing' : ''}" data-emoji="laughing">
                    😂 <span>${reactions.laughing || 0}</span>
                </button>
                <button class="reaction-btn ${userReactions.includes('crying') ? 'active crying' : ''}" data-emoji="crying">
                    😭 <span>${reactions.crying || 0}</span>
                </button>
                <button class="reaction-btn ${userReactions.includes('surprised') ? 'active surprised' : ''}" data-emoji="surprised">
                    😲 <span>${reactions.surprised || 0}</span>
                </button>
            </div>
        </div>
    `;
}

async function loadReviews() {
    const feed = document.getElementById('feed');
    const loading = document.getElementById('loading');
    
    try {
        const reviews = await apiRequest('/reviews/random?limit=20');
        
        if (reviews.length === 0) {
            feed.innerHTML = '<div class="loading">No reviews yet. Be the first to add one!</div>';
            return;
        }
        
        feed.innerHTML = reviews.map(renderReviewCard).join('');
        
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', handleReaction);
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
        feed.innerHTML = '<div class="loading">Failed to load reviews</div>';
    }
}

async function handleReaction(e) {
    const btn = e.currentTarget;
    const emoji = btn.dataset.emoji;
    const card = btn.closest('.review-card');
    const reviewId = card.dataset.id;

    if (!currentUser) {
        showAuthModal();
        return;
    }

    try {
        const result = await apiRequest(`/reviews/${reviewId}/reactions`, {
            method: 'POST',
            body: JSON.stringify({ emoji_type: emoji })
        });

        btn.classList.toggle('active', result.isAdded);
        btn.classList.toggle(emoji, result.isAdded);
        btn.querySelector('span').textContent = result.reactions[emoji] || 0;
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
}

function hideAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

function showReviewModal() {
    document.getElementById('reviewModal').classList.add('show');
    loadTags();
}

function hideReviewModal() {
    document.getElementById('reviewModal').classList.remove('show');
    document.getElementById('reviewForm').reset();
    selectedRating = 0;
    selectedTags = [];
    document.querySelectorAll('.star-rating span').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tag-option').forEach(t => t.classList.remove('selected'));
    document.getElementById('charCount').textContent = '0';
}

async function loadTags() {
    try {
        allTags = await apiRequest('/reviews/tags');
        const container = document.getElementById('tagsContainer');
        container.innerHTML = allTags.map(tag => 
            `<span class="tag-option" data-id="${tag.id}">#${tag.name}</span>`
        ).join('');

        container.querySelectorAll('.tag-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const tagId = parseInt(opt.dataset.id);
                opt.classList.toggle('selected');
                if (selectedTags.includes(tagId)) {
                    selectedTags = selectedTags.filter(t => t !== tagId);
                } else {
                    selectedTags.push(tagId);
                }
            });
        });
    } catch (error) {
        console.error('Error loading tags:', error);
    }
}

async function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('authSubmit');
    
    submitBtn.disabled = true;
    submitBtn.textContent = currentAuthTab === 'login' ? 'Logging in...' : 'Signing up...';

    try {
        const endpoint = currentAuthTab === 'login' ? '/auth/login' : '/auth/register';
        const data = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        if (currentAuthTab === 'login') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateUI();
            showToast('Welcome back!');
        } else {
            showToast('Account created! Please log in.', 'success');
            switchAuthTab('login');
        }
        hideAuthModal();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentAuthTab === 'login' ? 'Log In' : 'Sign Up';
    }
}

function switchAuthTab(tab) {
    currentAuthTab = tab;
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.getElementById('email').parentElement.style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('authSubmit').textContent = tab === 'login' ? 'Log In' : 'Sign Up';
}

function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const addReviewBtn = document.getElementById('addReviewBtn');
    const userMenu = document.getElementById('userMenu');
    const userInitial = document.getElementById('userInitial');

    if (currentUser) {
        loginBtn.classList.add('hidden');
        addReviewBtn.classList.remove('hidden');
        userMenu.classList.remove('hidden');
        userInitial.textContent = getInitial(currentUser.username);
    } else {
        loginBtn.classList.remove('hidden');
        addReviewBtn.classList.add('hidden');
        userMenu.classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateUI();
    showToast('Logged out successfully');
    loadReviews();
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const mediaType = document.getElementById('mediaType').value;
    const mediaTitle = document.getElementById('mediaTitle').value;
    const reviewText = document.getElementById('reviewText').value;
    const rating = selectedRating || null;

    try {
        await apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify({
                media_type: mediaType,
                media_title: mediaTitle,
                review_text: reviewText,
                rating,
                tags: selectedTags
            })
        });

        showToast('Review posted!');
        hideReviewModal();
        loadReviews();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    updateUI();
    loadReviews();

    document.getElementById('loginBtn').addEventListener('click', showAuthModal);
    document.getElementById('closeAuthModal').addEventListener('click', hideAuthModal);
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    document.getElementById('addReviewBtn').addEventListener('click', showReviewModal);
    document.getElementById('closeReviewModal').addEventListener('click', hideReviewModal);
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);

    document.querySelectorAll('.star-rating span').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            document.querySelectorAll('.star-rating span').forEach((s, i) => {
                s.classList.toggle('active', i < selectedRating);
            });
        });
    });

    document.getElementById('reviewText').addEventListener('input', (e) => {
        document.getElementById('charCount').textContent = e.target.value.length;
    });

    document.getElementById('userAvatar').addEventListener('click', () => {
        document.getElementById('dropdownMenu').classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('dropdownMenu').classList.remove('show');
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') hideAuthModal();
    });

    document.getElementById('reviewModal').addEventListener('click', (e) => {
        if (e.target.id === 'reviewModal') hideReviewModal();
    });
});
