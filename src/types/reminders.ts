export interface Reminder {
  _id: string
  title: string
  description?: string
  dueDate?: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReminderData {
  title: string
  description?: string
  dueDate?: string
}

export interface UpdateReminderData {
  title?: string
  description?: string
  dueDate?: string
  completed?: boolean
}

export interface RemindersFilters {
  completed?: boolean
  fromDate?: string
  toDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface RemindersResponse {
  reminders: Reminder[]
  total?: number
  page?: number
  totalPages?: number
}
