import { CreateReminderData, UpdateReminderData, RemindersFilters, RemindersResponse } from '@/types/reminders'

class RemindersApi {
  private baseUrl = '/api/reminders'

  async getReminders(filters: RemindersFilters = {}): Promise<RemindersResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const response = await fetch(`${this.baseUrl}?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch reminders')
    }

    return response.json()
  }

  async getReminderById(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch reminder')
    }

    return response.json()
  }

  async createReminder(data: CreateReminderData) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create reminder')
    }

    return response.json()
  }

  async updateReminder(id: string, data: UpdateReminderData) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update reminder')
    }

    return response.json()
  }

  async deleteReminder(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete reminder')
    }

    return response.json()
  }

  async toggleComplete(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to toggle reminder completion')
    }

    return response.json()
  }

  async getUpcomingReminders(days: number = 7) {
    const response = await fetch(`${this.baseUrl}/upcoming?days=${days}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch upcoming reminders')
    }

    return response.json()
  }

  async getOverdueReminders() {
    const response = await fetch(`${this.baseUrl}/overdue`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch overdue reminders')
    }

    return response.json()
  }

  async getRemindersByDate(date: string) {
    const response = await fetch(`${this.baseUrl}/date/${date}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch reminders for date')
    }

    return response.json()
  }
}

export const remindersApi = new RemindersApi()