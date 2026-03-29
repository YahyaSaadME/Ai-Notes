// Types for Notes and Comments system

export interface Comment {
  _id: string
  text: string
  createdBy: string
  createdAt: string
  isPrivate: boolean
  privateUsers?: string[] // Array of user IDs who can see this private comment
  replies: Comment[]
}

export interface Note {
  _id: string
  title: string
  description: string
  type: 'work' | 'personal'
  completed: boolean
  prioritize: boolean
  deadline?: string
  tags: string[]
  createdby: string
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface CreateNoteData {
  title: string
  description: string
  type: 'work' | 'personal'
  deadline?: string
  tags: string
  prioritize: boolean
}

export interface UpdateNoteData {
  title?: string
  description?: string
  type?: 'work' | 'personal'
  completed?: boolean
  prioritize?: boolean
  deadline?: string
  tags?: string[]
}

export interface CreateCommentData {
  text: string
  isPrivate?: boolean
  privateUsers?: string[]
}

export interface UpdateCommentData {
  text?: string
  isPrivate?: boolean
  privateUsers?: string[]
}

export interface NotesFilters {
  type: string
  completed: string
  prioritize: string
  sortBy: string
  sortOrder: string
  search?: string
  tags?: string
  date?: string
  deadline?: string
  page?: number
  limit?: number
}

export interface NotesResponse {
  notes: Note[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}