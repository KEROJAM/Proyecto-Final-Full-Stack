import { describe, it, expect, beforeEach, vi } from 'vitest'

const avatarColors = ['#F4C2C2', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#FFDAC1', '#E0BBE4', '#FFB7B2', '#C9E4CA', '#F0E6EF', '#E8D5B7']

function getAvatarColor(username) {
  if (!username) return avatarColors[0]
  const index = username.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
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

describe('getAvatarColor', () => {
  it('should return first color for null username', () => {
    expect(getAvatarColor(null)).toBe(avatarColors[0])
    expect(getAvatarColor('')).toBe(avatarColors[0])
  })

  it('should return consistent color based on username', () => {
    const aliceColor = getAvatarColor('Alice')
    const bobColor = getAvatarColor('Bob')
    expect(aliceColor).toBeDefined()
    expect(bobColor).toBeDefined()
    expect(aliceColor).not.toBe(bobColor)
  })

  it('should return same color for same first letter', () => {
    expect(getAvatarColor('Alice')).toBe(getAvatarColor('Anna'))
  })
})

describe('formatDate', () => {
  it('should return "now" for dates less than an hour ago', () => {
    const now = new Date()
    expect(formatDate(now.toISOString())).toBe('now')
  })

  it('should return hours for dates less than a day ago', () => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    expect(formatDate(hourAgo.toISOString())).toBe('1h')
  })

  it('should return days for dates less than a week ago', () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(formatDate(dayAgo.toISOString())).toBe('1d')
  })

  it('should return formatted date for older dates', () => {
    const oldDate = new Date('2023-01-15')
    expect(formatDate(oldDate.toISOString())).toMatch(/[A-Z][a-z]{2} \d{1,2}/)
  })
})

describe('getMediaEmoji', () => {
  it('should return correct emoji for each media type', () => {
    expect(getMediaEmoji('book')).toBe('📖')
    expect(getMediaEmoji('movie')).toBe('🎬')
    expect(getMediaEmoji('tv')).toBe('📺')
    expect(getMediaEmoji('anime')).toBe('🎌')
    expect(getMediaEmoji('music')).toBe('🎵')
    expect(getMediaEmoji('game')).toBe('🎮')
  })

  it('should return default emoji for unknown type', () => {
    expect(getMediaEmoji('unknown')).toBe('📌')
  })
})

describe('getMediaTypeColor', () => {
  it('should return correct color for each media type', () => {
    expect(getMediaTypeColor('movie')).toBe('#ef9ba5')
    expect(getMediaTypeColor('tv')).toBe('#c4efbd')
    expect(getMediaTypeColor('game')).toBe('#bdd9ef')
    expect(getMediaTypeColor('book')).toBe('#fcc58a')
    expect(getMediaTypeColor('anime')).toBe('#e0bbe4')
    expect(getMediaTypeColor('music')).toBe('#fcf4ab')
  })

  it('should return default color for unknown type', () => {
    expect(getMediaTypeColor('unknown')).toBe('#E8E4DE')
  })
})
