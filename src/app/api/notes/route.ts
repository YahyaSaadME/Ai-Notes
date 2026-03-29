import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Note from '../../../models/Note'
import { verifyToken } from '../../../lib/auth'

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
    const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, deadline, title
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc or desc
    const page = parseInt(searchParams.get('page') || '1') // page number
    const limit = parseInt(searchParams.get('limit') || '12') // items per page

    const query: Record<string, unknown> = { createdby: payload.email }

    if (type && ['work', 'personal'].includes(type)) {
      query.type = type
    }

    if (completed !== null) {
      query.completed = completed === 'true'
    }

    if (prioritize !== null) {
      query.prioritize = prioritize === 'true'
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase())
      query.tags = { $in: tagArray }
    }

    if (date) {
      // Filter by created date (YYYY-MM-DD)
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      query.createdAt = { $gte: startDate, $lt: endDate }
    }

    if (deadline) {
      // Filter by deadline date (YYYY-MM-DD)
      const deadlineDate = new Date(deadline)
      const nextDay = new Date(deadline)
      nextDay.setDate(nextDay.getDate() + 1)
      query.deadline = { $gte: deadlineDate, $lt: nextDay }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const sortOptions: Record<string, 1 | -1> = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

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

    await connectDB()

    const body = await request.json()

    const { title, description, deadline, completed, prioritize, type, tags } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    if (!['work', 'personal'].includes(type)) {
      return NextResponse.json({ error: 'Type must be work or personal' }, { status: 400 })
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

    const note = new Note(noteData)
    await note.save()

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}