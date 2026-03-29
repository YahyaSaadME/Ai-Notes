import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Note from '../../../../models/Note'
import { verifyToken } from '../../../../lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
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

    const { noteId } = await params

    const note = await Note.findOne({
      _id: noteId,
      createdby: payload.email
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
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

    const { noteId } = await params

    const body = await request.json()
    const { title, description, deadline, completed, prioritize, type, tags } = body

    // Fetch existing note to get current values
    const existingNote = await Note.findOne({
      _id: noteId,
      createdby: payload.email
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Use provided values or existing values
    const finalTitle = title !== undefined ? title : existingNote.title
    const finalType = type !== undefined ? type : existingNote.type

    if (!finalTitle || !finalType) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    if (!['work', 'personal'].includes(finalType)) {
      return NextResponse.json({ error: 'Type must be work or personal' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      title: finalTitle.trim(),
      description: description !== undefined ? (description ? description.trim() : '') : existingNote.description,
      type: finalType
    }

    if (deadline !== undefined) {
      updateData.deadline = deadline ? new Date(deadline) : undefined
    }

    if (typeof completed === 'boolean') {
      updateData.completed = completed
    }

    if (typeof prioritize === 'boolean') {
      updateData.prioritize = prioritize
    }

    if (tags !== undefined && Array.isArray(tags)) {
      updateData.tags = tags.map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag)
    }

    const note = await Note.findOneAndUpdate(
      { _id: noteId, createdby: payload.email },
      updateData,
      { new: true }
    )

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
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

    const { noteId } = await params

    const note = await Note.findOneAndDelete({
      _id: noteId,
      createdby: payload.email
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}