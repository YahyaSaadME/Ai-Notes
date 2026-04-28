import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Note from '../../../models/Note'
import User from '../../../models/User'
import { verifyToken } from '../../../lib/auth'
import { canCreateNote, getNoteReadScope } from '@/lib/rbac'

type UserEmailLookup = {
  email?: string
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // work or personal
    const completed = searchParams.get('completed') // true or false
    const prioritize = searchParams.get('prioritize') // true or false
    const tags = searchParams.get('tags') // comma-separated tags
    const search = searchParams.get('search') // search in title and description
    const date = searchParams.get('date') // specific date (YYYY-MM-DD)
    const deadline = searchParams.get('deadline') // deadline filter
    const workflowStatus = searchParams.get('workflowStatus')
    const visibility = searchParams.get('visibility')
    const assignee = searchParams.get('assignee')
    const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, deadline, title
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc or desc
    const page = parseInt(searchParams.get('page') || '1') // page number
    const limit = parseInt(searchParams.get('limit') || '12') // items per page

    const andConditions: Record<string, unknown>[] = []
    const readScope = getNoteReadScope(payload)
    if (Object.keys(readScope).length > 0) {
      andConditions.push(readScope)
    }

    if (type && ['work', 'personal'].includes(type)) {
      andConditions.push({ type })
    }

    if (completed !== null) {
      andConditions.push({ completed: completed === 'true' })
    }

    if (prioritize !== null) {
      andConditions.push({ prioritize: prioritize === 'true' })
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase())
      andConditions.push({ tags: { $in: tagArray } })
    }

    if (date) {
      // Filter by created date (YYYY-MM-DD)
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      andConditions.push({ createdAt: { $gte: startDate, $lt: endDate } })
    }

    if (deadline) {
      // Filter by deadline date (YYYY-MM-DD)
      const deadlineDate = new Date(deadline)
      const nextDay = new Date(deadline)
      nextDay.setDate(nextDay.getDate() + 1)
      andConditions.push({ deadline: { $gte: deadlineDate, $lt: nextDay } })
    }

    if (workflowStatus && ['backlog', 'in_progress', 'review', 'done'].includes(workflowStatus)) {
      andConditions.push({ workflowStatus })
    }

    if (visibility && ['org', 'private'].includes(visibility)) {
      andConditions.push({ visibility })
    }

    if (assignee) {
      const normalizedAssignee = assignee.trim()

      if (normalizedAssignee.includes('@')) {
        andConditions.push({ assignedTo: normalizedAssignee.toLowerCase() })
      } else {
        const nameRegex = new RegExp(escapeRegex(normalizedAssignee), 'i')
        const matchingUsers = await User.find<UserEmailLookup>({
          $or: [
            { name: { $regex: nameRegex } },
            { email: { $regex: nameRegex } },
          ],
        })
          .select('email')
          .limit(25)
          .lean()

        const assigneeEmails = matchingUsers
          .map((user) => String(user.email || '').toLowerCase())
          .filter(Boolean)

        if (assigneeEmails.length > 0) {
          andConditions.push({ assignedTo: { $in: assigneeEmails } })
        } else {
          // Force empty result when no matching assignee is found.
          andConditions.push({ assignedTo: '__no_match__' })
        }
      }
    }

    if (search) {
      andConditions.push({
        $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ],
      })
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {}

    const sortOptions: Record<string, 1 | -1> = {}
    const allowedSortFields = ['createdAt', 'deadline', 'title', 'updatedAt', 'workflowStatus']
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    sortOptions[finalSortBy] = sortOrder === 'asc' ? 1 : -1

    const skip = (page - 1) * limit
    const total = await Note.countDocuments(query)
    const notes = await Note.find(query).sort(sortOptions).skip(skip).limit(limit).lean()

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      notes,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!canCreateNote(payload)) {
      return NextResponse.json({ error: 'Role is not allowed to create notes' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()

    const {
      title,
      description,
      deadline,
      completed,
      prioritize,
      type,
      tags,
      workflowStatus,
      visibility,
      assignedTo,
    } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    if (!['work', 'personal'].includes(type)) {
      return NextResponse.json({ error: 'Type must be work or personal' }, { status: 400 })
    }

    if (workflowStatus && !['backlog', 'in_progress', 'review', 'done'].includes(workflowStatus)) {
      return NextResponse.json({ error: 'Invalid workflow status' }, { status: 400 })
    }

    if (visibility && !['org', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
    }

    const noteData: Record<string, unknown> = {
      title: title.trim(),
      description: description ? description.trim() : '',
      type,
      createdby: payload.email
    }

    if (deadline) {
      noteData.deadline = new Date(deadline)
    }

    if (typeof completed === 'boolean') {
      noteData.completed = completed
    }

    if (typeof prioritize === 'boolean') {
      noteData.prioritize = prioritize
    }

    if (tags && Array.isArray(tags)) {
      noteData.tags = tags.map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag)
    }

    if (workflowStatus) {
      noteData.workflowStatus = workflowStatus
    }

    if (visibility) {
      noteData.visibility = visibility
    }

    if (assignedTo) {
      const normalizedAssignee = String(assignedTo).trim()

      if (normalizedAssignee.includes('@')) {
        noteData.assignedTo = normalizedAssignee.toLowerCase()
      } else {
        const exactNameRegex = new RegExp(`^${escapeRegex(normalizedAssignee)}$`, 'i')
        const matchedUser = await User.findOne<UserEmailLookup>({ name: { $regex: exactNameRegex } })
          .select('email')
          .lean()

        if (!matchedUser?.email) {
          return NextResponse.json({ error: 'Assigned user name not found' }, { status: 400 })
        }

        noteData.assignedTo = String(matchedUser.email).toLowerCase()
      }
    }

    const note = new Note(noteData)
    await note.save()

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
