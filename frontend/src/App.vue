<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <div class="app-container">
        <main class="main-feed">
          <header class="feed-header">
            <div class="header-content">
              <h1 class="logo">Reviewer</h1>
              <n-button v-if="!currentUser" type="primary" @click="showAuthModal = true">
                Log in
              </n-button>
              <template v-else>
                <n-button type="primary" size="small" @click="showReviewModal = true">
                  + Review
                </n-button>
                <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
                  <n-avatar class="header-avatar" :style="{ backgroundColor: '#E8B4B8' }">
                    {{ userInitial }}
                  </n-avatar>
                </n-dropdown>
              </template>
            </div>
          </header>
          
          <div v-if="currentUser" class="compose-box">
            <n-avatar class="compose-avatar" :style="{ backgroundColor: getAvatarColor(currentUser.username) }">
              {{ userInitial }}
            </n-avatar>
            <div class="compose-input">
              <input 
                type="text" 
                placeholder="What are you reviewing?"
                @click="showReviewModal = true"
              >
            </div>
          </div>

          <n-spin v-if="loading" class="loading-feed" />
          <template v-else>
            <n-empty v-if="reviews.length === 0" description="No reviews yet. Be the first!" />
            <div v-else class="feed-list">
              <article v-for="review in reviews" :key="review.id" class="feed-item" :aria-label="`Review by ${review.username} about ${review.media_title}`">
                <div class="review-content">
                  <div class="review-left">
                    <div class="review-header">
                      <div class="review-user-row">
                        <n-avatar class="feed-avatar" :style="{ backgroundColor: getAvatarColor(review.username) }">
                          {{ review.username?.charAt(0).toUpperCase() || 'U' }}
                        </n-avatar>
                        <div class="user-info">
                          <span class="feed-name">{{ review.name || review.username }}</span>
                          <span class="feed-handle">@{{ review.username }}</span>
                          <span class="feed-dot">·</span>
                          <span class="feed-time">{{ formatDate(review.created_at) }}</span>
                        </div>
                      </div>
                      <template v-if="currentUser && currentUser.id === review.user_id">
                        <div class="review-actions">
                          <button class="action-btn edit-btn" @click="openEditModal(review)">Editar</button>
                          <button class="action-btn delete-btn" @click="handleDeleteReview(review.id)">Borrar</button>
                        </div>
                      </template>
                    </div>
                    
                    <h3 class="media-title">{{ review.media_title }}</h3>
                    
                    <div class="media-tags">
                      <span class="media-type-tag" :style="{ backgroundColor: getMediaTypeColor(review.media_type) }">
                        {{ getMediaEmoji(review.media_type) }} {{ review.media_type }}
                      </span>
                      <span v-if="review.tags" v-for="tag in review.tags.split(',')" :key="tag" class="tag" role="listitem">#{{ tag.trim() }}</span>
                    </div>
                    
                    <p class="feed-text">"{{ review.review_text }}"</p>
                    
                    <div v-if="review.rating" class="feed-rating" aria-label="Rating: {{ review.rating }} out of 5 stars">
                      <span v-for="i in 5" :key="i" :class="['star', { filled: i <= review.rating }]" aria-hidden="true">★</span>
                    </div>
                    
                    <div class="feed-actions" role="group" aria-label="Reactions">
                      <button 
                        :class="['reaction-btn', 'heart-btn', { active: review.userReactions?.includes('heart'), 'has-count': review.reactions?.heart > 0 }]" 
                        @click="handleReaction(review.id, 'heart')"
                        :aria-label="`Heart reaction, ${review.reactions?.heart || 0} likes`"
                      >
                        <span class="emoji" aria-hidden="true">♥</span>
                        <span class="count">{{ review.reactions?.heart || 0 }}</span>
                      </button>
                      <button 
                        :class="['reaction-btn', { active: review.userReactions?.includes('laughing'), 'has-count': review.reactions?.laughing > 0 }]" 
                        @click="handleReaction(review.id, 'laughing')"
                        :aria-label="`Laugh reaction, ${review.reactions?.laughing || 0}`"
                      >
                        <span class="emoji" aria-hidden="true">😂</span>
                        <span class="count">{{ review.reactions?.laughing || 0 }}</span>
                      </button>
                      <button 
                        :class="['reaction-btn', { active: review.userReactions?.includes('crying'), 'has-count': review.reactions?.crying > 0 }]" 
                        @click="handleReaction(review.id, 'crying')"
                        :aria-label="`Cry reaction, ${review.reactions?.crying || 0}`"
                      >
                        <span class="emoji" aria-hidden="true">😭</span>
                        <span class="count">{{ review.reactions?.crying || 0 }}</span>
                      </button>
                      <button 
                        :class="['reaction-btn', { active: review.userReactions?.includes('surprised'), 'has-count': review.reactions?.surprised > 0 }]" 
                        @click="handleReaction(review.id, 'surprised')"
                        :aria-label="`Surprised reaction, ${review.reactions?.surprised || 0}`"
                      >
                        <span class="emoji" aria-hidden="true">😲</span>
                        <span class="count">{{ review.reactions?.surprised || 0 }}</span>
                      </button>
                      <button class="comment-btn" @click="toggleComments(review.id)">
                        <span class="emoji">💬</span>
                        <span class="count">{{ review.comments?.length || 0 }}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="review.cover" class="review-cover" aria-label="Cover image">
                    <img :src="`/api/proxy-image?url=${encodeURIComponent(review.cover)}`" :alt="`Cover for ${review.media_title}`" @error="handleImageError">
                  </div>
                </div>
                
                <div v-if="expandedComments[review.id]" class="comments-section">
                  <div v-if="review.comments && review.comments.length > 0" class="comments-list">
                    <div v-for="comment in review.comments" :key="comment.id" class="comment-item">
                      <n-avatar class="comment-avatar" :style="{ backgroundColor: getAvatarColor(comment.username) }" :size="28">
                        {{ comment.username?.charAt(0).toUpperCase() || 'U' }}
                      </n-avatar>
                      <div class="comment-content">
                        <div class="comment-header">
                          <span class="comment-username">{{ comment.name || comment.username }}</span>
                          <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                        </div>
                        <p class="comment-text">{{ comment.comment_text }}</p>
                      </div>
                      <button v-if="currentUser && currentUser.id === comment.user_id" class="delete-comment-btn" @click="handleDeleteComment(review.id, comment.id)">✕</button>
                    </div>
                  </div>
                  <div v-else class="no-comments">No comments yet</div>
                  
                  <div v-if="currentUser" class="comment-input-container">
                    <n-avatar class="comment-input-avatar" :style="{ backgroundColor: getAvatarColor(currentUser.username) }" :size="28">
                      {{ userInitial }}
                    </n-avatar>
                    <input 
                      v-model="commentInputs[review.id]"
                      type="text" 
                      class="comment-input"
                      placeholder="Add a comment..."
                      @keyup.enter="submitComment(review.id)"
                    >
                    <button class="send-comment-btn" @click="submitComment(review.id)">Send</button>
                  </div>
                  <div v-else class="login-to-comment">
                    <span class="link" @click="showAuthModal = true">Log in</span> to comment
                  </div>
                </div>
              </article>
            </div>
          </template>
        </main>
      </div>

      <n-modal v-model:show="showAuthModal" preset="card" class="auth-modal" :style="{ maxWidth: '360px' }">
        <div class="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to share your reviews</p>
        </div>
        <n-tabs v-model:value="authTab" animated>
          <n-tab-pane name="login" tab="Log in">
            <n-form>
              <n-form-item label="Email">
                <n-input v-model:value="loginForm.email" type="email" placeholder="Email" />
              </n-form-item>
              <n-form-item label="Password">
                <n-input v-model:value="loginForm.password" type="password" placeholder="Password" />
              </n-form-item>
              <n-button type="primary" block :loading="authLoading" @click="handleLogin">
                Log in
              </n-button>
            </n-form>
            <div class="auth-switch">
              Don't have an account? 
              <span class="link" @click="authTab = 'register'">Sign up</span>
            </div>
          </n-tab-pane>
          <n-tab-pane name="register" tab="Sign up">
            <n-form>
              <n-form-item label="Username">
                <n-input v-model:value="registerForm.username" placeholder="Username" />
              </n-form-item>
              <n-form-item label="Email">
                <n-input v-model:value="registerForm.email" type="email" placeholder="Email" />
              </n-form-item>
              <n-form-item label="Password">
                <n-input v-model:value="registerForm.password" type="password" placeholder="Password" />
              </n-form-item>
              <n-button type="primary" block :loading="authLoading" @click="handleRegister">
                Create account
              </n-button>
            </n-form>
            <div class="auth-switch">
              Already have an account? 
              <span class="link" @click="authTab = 'login'">Log in</span>
            </div>
          </n-tab-pane>
        </n-tabs>
      </n-modal>

      <n-modal v-model:show="showReviewModal" preset="card" title="New Review" class="review-modal" :style="{ maxWidth: '480px' }">
        <n-form>
          <n-form-item label="Type">
            <n-select v-model:value="reviewForm.media_type" :options="mediaTypeOptions" />
          </n-form-item>
          <n-form-item label="Title">
            <n-input v-model:value="reviewForm.media_title" placeholder="What did you review?" />
          </n-form-item>
          <n-form-item label="Cover (optional)">
            <n-input v-model:value="reviewForm.cover" placeholder="Image URL" />
          </n-form-item>
          <n-form-item label="Rating">
            <div class="rating-select">
              <span 
                v-for="i in 5" 
                :key="i" 
                :class="['star-option', { active: i <= reviewForm.rating }]"
                @click="reviewForm.rating = i"
              >★</span>
            </div>
          </n-form-item>
          <n-form-item label="Review">
            <n-input v-model:value="reviewForm.review_text" type="textarea" placeholder="Your review in one sentence..." :maxlength="200" show-count />
          </n-form-item>
          <n-form-item label="Tags">
            <n-checkbox-group v-model:value="reviewForm.tags">
              <n-space>
                <n-checkbox v-for="tag in allTags" :key="tag.id" :value="tag.id" :label="tag.name" />
              </n-space>
            </n-checkbox-group>
          </n-form-item>
          <n-button type="primary" block :loading="reviewLoading" @click="handleReviewSubmit">
            Post Review
          </n-button>
        </n-form>
      </n-modal>

      <n-modal v-model:show="showEditModal" preset="card" title="Edit Review" class="review-modal" :style="{ maxWidth: '480px' }">
        <n-form>
          <n-form-item label="Type">
            <n-select v-model:value="editForm.media_type" :options="mediaTypeOptions" />
          </n-form-item>
          <n-form-item label="Title">
            <n-input v-model:value="editForm.media_title" placeholder="What did you review?" />
          </n-form-item>
          <n-form-item label="Cover (optional)">
            <n-input v-model:value="editForm.cover" placeholder="Image URL" />
          </n-form-item>
          <n-form-item label="Rating">
            <div class="rating-select">
              <span 
                v-for="i in 5" 
                :key="i" 
                :class="['star-option', { active: i <= editForm.rating }]"
                @click="editForm.rating = i"
              >★</span>
            </div>
          </n-form-item>
          <n-form-item label="Review">
            <n-input v-model:value="editForm.review_text" type="textarea" placeholder="Your review in one sentence..." :maxlength="200" show-count />
          </n-form-item>
          <n-form-item label="Tags">
            <n-checkbox-group v-model:value="editForm.tags">
              <n-space>
                <n-checkbox v-for="tag in allTags" :key="tag.id" :value="tag.id" :label="tag.name" />
              </n-space>
            </n-checkbox-group>
          </n-form-item>
          <n-button type="primary" block :loading="reviewLoading" @click="handleEditReview">
            Save Changes
          </n-button>
        </n-form>
      </n-modal>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  NConfigProvider, NButton, NAvatar, NDropdown, NModal, NTabs, NTabPane,
  NForm, NFormItem, NInput, NSelect, NRate, NSpin, NEmpty, NCheckboxGroup,
  NCheckbox, NSpace, NMessageProvider
} from 'naive-ui'

const API_URL = '/api'

const currentUser = ref(null)
const reviews = ref([])
const loading = ref(true)
const showAuthModal = ref(false)
const showReviewModal = ref(false)
const showEditModal = ref(false)
const editingReviewId = ref(null)
const authTab = ref('login')
const authLoading = ref(false)
const reviewLoading = ref(false)
const allTags = ref([])

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })
const reviewForm = ref({
  media_type: 'movie',
  media_title: '',
  cover: '',
  review_text: '',
  rating: 0,
  tags: []
})

const editForm = ref({
  media_type: 'movie',
  media_title: '',
  cover: '',
  review_text: '',
  rating: 0,
  tags: []
})

const avatarColors = ['#F4C2C2', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#FFDAC1', '#E0BBE4', '#FFB7B2', '#C9E4CA', '#F0E6EF', '#E8D5B7']
const expandedComments = ref({})
const commentInputs = ref({})

function getAvatarColor(username) {
  if (!username) return avatarColors[0]
  const index = username.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
}

const themeOverrides = {
  common: {
    primaryColor: '#7BA3C9',
    primaryColorHover: '#6892BC',
    primaryColorPressed: '#5A7FA0',
    primaryColorSuppl: '#B5EAD7',
    borderRadius: '8px',
    fontFamily: "'DM Sans', -apple-system, sans-serif"
  },
  Button: {
    textColorPrimary: '#FFFFFF'
  },
  Card: {
    borderRadius: '16px'
  }
}

const mediaTypeOptions = [
  { label: '📖 Book', value: 'book' },
  { label: '🎬 Movie', value: 'movie' },
  { label: '📺 TV', value: 'tv' },
  { label: '🎌 Anime', value: 'anime' },
  { label: '🎵 Music', value: 'music' },
  { label: '🎮 Game', value: 'game' }
]

const userMenuOptions = [
  { label: 'Profile', key: 'profile' },
  { label: 'Log out', key: 'logout' }
]

const userInitial = computed(() => currentUser.value?.username?.charAt(0).toUpperCase() || 'U')

const mediaTypeColors = {
  movie: '#ef9ba5',
  tv: '#c4efbd',
  game: '#bdd9ef',
  book: '#fcc58a',
  anime: '#e0bbe4',
  music: '#fcf4ab'
}

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  }
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  
  // Mejorado: Verificar si la respuesta es JSON antes de parsear
  const contentType = response.headers.get('content-type')
  let data
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      console.error(`API error: Expected JSON but got ${contentType || 'unknown'}`, text)
      throw new Error(`Invalid response type: ${contentType || 'unknown'}`)
    }
  } catch (e) {
    console.error(`Failed to parse response from ${endpoint}:`, e)
    throw new Error(`Failed to parse API response: ${e.message}`)
  }
  
  if (!response.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (hours < 1) return 'now'
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getMediaEmoji(type) {
  const emojis = { book: '📖', movie: '🎬', tv: '📺', anime: '🎌', music: '🎵', game: '🎮' }
  return emojis[type] || '📌'
}

function getMediaTypeColor(type) {
  const colors = {
    movie: '#ef9ba5',
    tv: '#c4efbd',
    game: '#bdd9ef',
    book: '#fcc58a',
    anime: '#e0bbe4',
    music: '#fcf4ab'
  }
  return colors[type] || '#E8E4DE'
}

function handleImageError(e) {
  e.target.style.display = 'none'
}

async function loadReviews() {
  loading.value = true
  try {
    reviews.value = await apiRequest('/reviews/random?limit=20')
    for (const review of reviews.value) {
      try {
        const reactionData = await apiRequest(`/reviews/${review.id}/reactions`)
        review.reactions = reactionData.reactions
        review.userReactions = reactionData.userReactions || []
      } catch (e) {
        review.reactions = { heart: 0, laughing: 0, crying: 0, surprised: 0 }
        review.userReactions = []
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  try {
    allTags.value = await apiRequest('/reviews/tags')
  } catch (error) {
    console.error('Error:', error)
  }
}

async function handleLogin() {
  authLoading.value = true
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm.value)
    })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    currentUser.value = data.user
    showAuthModal.value = false
  } catch (error) {
    alert(error.message)
  } finally {
    authLoading.value = false
  }
}

async function handleRegister() {
  authLoading.value = true
  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerForm.value)
    })
    alert('Account created! Please log in.')
    authTab.value = 'login'
  } catch (error) {
    alert(error.message)
  } finally {
    authLoading.value = false
  }
}

async function handleReviewSubmit() {
  reviewLoading.value = true
  try {
    await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        media_type: reviewForm.value.media_type,
        media_title: reviewForm.value.media_title,
        cover: reviewForm.value.cover || null,
        review_text: reviewForm.value.review_text,
        rating: reviewForm.value.rating || null,
        tags: reviewForm.value.tags
      })
    })
    showReviewModal.value = false
    reviewForm.value = { media_type: 'movie', media_title: '', cover: '', review_text: '', rating: 0, tags: [] }
    loadReviews()
  } catch (error) {
    alert(error.message)
  } finally {
    reviewLoading.value = false
  }
}

function openEditModal(review) {
  editingReviewId.value = review.id
  editForm.value = {
    media_type: review.media_type,
    media_title: review.media_title,
    cover: review.cover || '',
    review_text: review.review_text,
    rating: review.rating || 0,
    tags: review.tags ? review.tags.split(',').map(t => t.trim()) : []
  }
  showEditModal.value = true
}

async function handleEditReview() {
  reviewLoading.value = true
  try {
    await apiRequest(`/reviews/${editingReviewId.value}`, {
      method: 'PUT',
      body: JSON.stringify({
        media_type: editForm.value.media_type,
        media_title: editForm.value.media_title,
        cover: editForm.value.cover || null,
        review_text: editForm.value.review_text,
        rating: editForm.value.rating || null,
        tags: editForm.value.tags
      })
    })
    showEditModal.value = false
    loadReviews()
  } catch (error) {
    alert(error.message)
  } finally {
    reviewLoading.value = false
  }
}

async function handleDeleteReview(reviewId) {
  if (!confirm('Are you sure you want to delete this review?')) return
  try {
    await apiRequest(`/reviews/${reviewId}`, {
      method: 'DELETE'
    })
    reviews.value = reviews.value.filter(r => r.id !== reviewId)
  } catch (error) {
    alert(error.message)
  }
}

async function handleReaction(reviewId, emoji) {
  try {
    const result = await apiRequest(`/reviews/${reviewId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji_type: emoji })
    })
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      review.reactions = result.reactions
      if (currentUser.value) {
        review.userReactions = result.userReactions || []
      }
    }
  } catch (error) {
    alert(error.message)
  }
}

function handleUserMenuSelect(key) {
  if (key === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    currentUser.value = null
    loadReviews()
  }
}

async function toggleComments(reviewId) {
  expandedComments.value[reviewId] = !expandedComments.value[reviewId]
  if (expandedComments.value[reviewId]) {
    const review = reviews.value.find(r => r.id === reviewId)
    if (review && !review.comments) {
      try {
        const data = await apiRequest(`/reviews/${reviewId}/comments`)
        review.comments = data.comments
      } catch (error) {
        console.error('Error loading comments:', error)
      }
    }
  }
}

async function submitComment(reviewId) {
  const commentText = commentInputs.value[reviewId]
  if (!commentText || commentText.trim() === '') return
  
  try {
    const data = await apiRequest(`/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text: commentText })
    })
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      review.comments = data.comments
    }
    commentInputs.value[reviewId] = ''
  } catch (error) {
    alert(error.message)
  }
}

async function handleDeleteComment(reviewId, commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return
  try {
    await apiRequest(`/comments/${commentId}`, {
      method: 'DELETE'
    })
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      review.comments = review.comments.filter(c => c.id !== commentId)
    }
  } catch (error) {
    alert(error.message)
  }
}

onMounted(async () => {
  const savedUser = localStorage.getItem('user')
  if (savedUser) currentUser.value = JSON.parse(savedUser)
  await Promise.all([loadReviews(), loadTags()])
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #FAF8F5;
  min-height: 100vh;
  font-family: 'DM Sans', -apple-system, sans-serif;
}

.app-container {
  max-width: 680px;
  margin: 0 auto;
  min-height: 100vh;
}

.main-feed {
  min-height: 100vh;
}

.feed-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #D49DA2;
}

.header-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.header-avatar:hover {
  transform: scale(1.08);
}

.compose-box {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  gap: 0.875rem;
  background: rgba(255,255,255,0.6);
}

.compose-avatar {
  flex-shrink: 0;
}

.compose-input {
  flex: 1;
}

.compose-input input {
  width: 100%;
  border: none;
  font-size: 1.1rem;
  padding: 0.5rem 0;
  outline: none;
  background: transparent;
  font-family: inherit;
  color: #2D3436;
}

.compose-input input::placeholder {
  color: #9CA3AF;
}

.loading-feed {
  padding: 4rem;
  display: flex;
  justify-content: center;
}

.feed-list {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
}

.feed-item {
  padding: 1rem 1.25rem;
  transition: all 0.2s ease;
  background: #FFFFFF;
  margin: 0.5rem 1rem;
  border-radius: 16px;
  border: 1px solid #F0EDE8;
}

.feed-item:hover {
  background: #FFFFFF;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-color: #E8E4DE;
}

.review-content {
  display: flex;
  gap: 1rem;
}

.review-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-user-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.feed-avatar {
  flex-shrink: 0;
  font-weight: 600;
  color: #2D3436;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.feed-name {
  font-weight: 600;
  color: #3D4852;
  font-size: 0.95rem;
}

.feed-handle, .feed-dot, .feed-time {
  color: #8795A1;
  font-size: 0.8rem;
}

.media-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2D3748;
  margin: 0;
  line-height: 1.3;
}

.media-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.media-type-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  text-transform: capitalize;
  color: #4A5568;
}

.tag {
  color: #7BA3C9;
  font-size: 0.8rem;
  font-weight: 500;
}

.feed-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #4A5568;
  margin: 0;
}

.feed-dot {
  display: inline;
}

.feed-rating {
  margin: 0.25rem 0;
}

.star {
  color: #E2E8F0;
  font-size: 1rem;
}

.star.filled {
  color: #D4AF37;
}

.feed-actions {
  display: flex;
  gap: 1.25rem;
  margin-top: 0.25rem;
}

.reaction-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #B8C2CC;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s ease;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}

.reaction-btn:hover {
  background: #F7F5F2;
}

.reaction-btn.has-count {
  color: #8795A1;
}

.reaction-btn.active,
.reaction-btn.active.has-count {
  color: #E53E3E !important;
}

.reaction-btn.active .emoji {
  transform: scale(1.1);
}

.reaction-btn .emoji {
  font-size: 1rem;
  transition: transform 0.2s;
}

.reaction-btn .count {
  font-size: 0.8rem;
}

.review-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.action-btn:hover {
  background: #F7F5F2;
  border-color: #CBD5E0;
}

.edit-btn {
  color: #7BA3C9;
}

.edit-btn:hover {
  background: #EBF4FF;
}

.delete-btn {
  color: #E53E3E;
}

.delete-btn:hover {
  background: #FED7D7;
}

.review-cover {
  width: 100px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #F7F5F2;
}

.review-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-cover.is-longest {
  width: 180px;
  height: 270px;
}

.auth-modal .n-card {
  border-radius: 20px !important;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-header h2 {
  font-size: 1.5rem;
  color: #2D3436;
  margin-bottom: 0.25rem;
}

.auth-header p {
  color: #9CA3AF;
  font-size: 0.95rem;
}

.auth-switch {
  text-align: center;
  margin-top: 1rem;
  color: #636E72;
  font-size: 0.9rem;
}

.auth-switch .link {
  color: #7BA3C9;
  cursor: pointer;
  font-weight: 500;
}

.auth-switch .link:hover {
  text-decoration: underline;
}

.review-modal .n-card {
  border-radius: 20px !important;
}

.rating-select {
  display: flex;
  gap: 0.25rem;
}

.star-option {
  font-size: 1.5rem;
  color: #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;
}

.star-option:hover,
.star-option.active {
  color: #D4AF37;
  transform: scale(1.1);
}

.n-button--primary-type {
  background-color: #7BA3C9 !important;
  border: none !important;
}

.n-button--primary-type:hover {
  background-color: #6892BC !important;
}

.comment-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #B8C2CC;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s ease;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}

.comment-btn:hover {
  background: #F7F5F2;
  color: #7BA3C9;
}

.comments-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #F0EDE8;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.comment-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  position: relative;
}

.comment-avatar {
  flex-shrink: 0;
  font-weight: 600;
  color: #2D3436;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.comment-username {
  font-weight: 600;
  font-size: 0.85rem;
  color: #3D4852;
}

.comment-time {
  font-size: 0.75rem;
  color: #8795A1;
}

.comment-text {
  font-size: 0.9rem;
  color: #4A5568;
  margin: 0;
  word-break: break-word;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #B8C2CC;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.2rem;
  opacity: 0;
  transition: all 0.2s;
}

.comment-item:hover .delete-comment-btn {
  opacity: 1;
}

.delete-comment-btn:hover {
  color: #E53E3E;
}

.comment-input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.comment-input-avatar {
  flex-shrink: 0;
  font-weight: 600;
  color: #2D3436;
}

.comment-input {
  flex: 1;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: #7BA3C9;
}

.send-comment-btn {
  background: #7BA3C9;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.send-comment-btn:hover {
  background: #6892BC;
}

.no-comments {
  color: #8795A1;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.5rem;
}

.login-to-comment {
  text-align: center;
  font-size: 0.85rem;
  color: #8795A1;
  padding: 0.5rem;
}

.login-to-comment .link {
  color: #7BA3C9;
  cursor: pointer;
}

.login-to-comment .link:hover {
  text-decoration: underline;
}
</style>
