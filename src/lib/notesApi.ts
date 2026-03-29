// API functions for Notes and Comments system

import { Note, Comment, CreateNoteData, UpdateNoteData, CreateCommentData, UpdateCommentData, NotesFilters, NotesResponse } from '@/types/notes'

const API_BASE = '/api'

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1]
  }
  return null
}

// Helper function for API requests
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Cookie: `auth-token=${token}` }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Notes API
export const notesApi = {
  // Get all notes with filters and pagination
  async getNotes(filters: NotesFilters = {
    type: '',
    completed: '',
    prioritize: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  }): Promise<NotesResponse> {
    const params = new URLSearchParams()

    if (filters.type) params.append('type', filters.type)
    if (filters.completed) params.append('completed', filters.completed)
    if (filters.prioritize) params.append('prioritize', filters.prioritize)
    if (filters.search) params.append('search', filters.search)
    if (filters.tags) params.append('tags', filters.tags)
    if (filters.date) params.append('date', filters.date)
    if (filters.deadline) params.append('deadline', filters.deadline)
    params.append('sortBy', filters.sortBy)
    params.append('sortOrder', filters.sortOrder)
    params.append('page', (filters.page || 1).toString())
    params.append('limit', (filters.limit || 12).toString())

    return apiRequest(`${API_BASE}/notes?${params}`)
  },

  // Create a new note
  async createNote(data: CreateNoteData): Promise<Note> {
    return apiRequest(`${API_BASE}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      })
    })
  },

  // Get a specific note
  async getNote(id: string): Promise<Note> {
    return apiRequest(`${API_BASE}/notes/${id}`)
  },

  // Update a note
  async updateNote(id: string, data: UpdateNoteData): Promise<Note> {
    return apiRequest(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Delete a note
  async deleteNote(id: string): Promise<{ message: string }> {
    return apiRequest(`${API_BASE}/notes/${id}`, {
      method: 'DELETE'
    })
  }
}

// Comments API
export const commentsApi = {
  // Get all comments for a note
  async getComments(noteId: string): Promise<Comment[]> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments`)
  },

  // Add a comment to a note
  async createComment(noteId: string, data: CreateCommentData): Promise<Comment> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Update a comment
  async updateComment(noteId: string, commentId: string, data: UpdateCommentData): Promise<Comment> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Delete a comment
  async deleteComment(noteId: string, commentId: string): Promise<{ message: string }> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments/${commentId}`, {
      method: 'DELETE'
    })
  },

  // Add a reply to a comment
  async createReply(noteId: string, commentId: string, data: CreateCommentData): Promise<Comment> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Update a reply
  async updateReply(noteId: string, commentId: string, replyId: string, data: UpdateCommentData): Promise<Comment> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments/${commentId}/replies/${replyId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Delete a reply
  async deleteReply(noteId: string, commentId: string, replyId: string): Promise<{ message: string }> {
    return apiRequest(`${API_BASE}/notes/${noteId}/comments/${commentId}/replies/${replyId}`, {
      method: 'DELETE'
    })
  }
}

// Users API for private comments
export const usersApi = {
  // Search users for private comment sharing
  async searchUsers(query: string): Promise<{ users: Array<{ _id: string; name: string; email: string; role: string }> }> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    return apiRequest(`${API_BASE.replace('/api', '')}/api/users/search?${params}`)
  },

  // Get users by IDs for displaying private comment recipients
  async getUsersByIds(ids: string[]): Promise<{ users: Array<{ _id: string; name: string; email: string; role: string }> }> {
    if (ids.length === 0) return { users: [] }
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))
    return apiRequest(`${API_BASE.replace('/api', '')}/api/users/by-ids?${params}`)
  }
}

// Projects API
export const projectsApi = {
  // Get all projects
  async getProjects(): Promise<Array<{ _id: string; title: string; description?: string; tags?: string[] }>> {
    return apiRequest(`${API_BASE}/projects`)
  }
}