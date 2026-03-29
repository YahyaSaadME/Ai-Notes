import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import Note from '../../../../../models/Note'
import { verifyToken } from '../../../../../lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await connectDB()
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { noteId } = await params  // Await params and destructure noteId

    const note = await Note.findOne({
      _id: noteId,  // Use noteId directly
      createdby: payload.email
    }).select('comments')

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note.comments || [])
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
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
    const { text, isPrivate } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    // Check if note exists and belongs to user
    const note = await Note.findOne({
      _id: noteId,
      createdby: payload.email
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const newComment = {
      text: text.trim(),
      createdBy: payload.email,
      isPrivate: Boolean(isPrivate),
      replies: []
    }

    note.comments.push(newComment)
    await note.save()

    // Return the newly added comment with its generated _id
    const addedComment = note.comments[note.comments.length - 1]

    return NextResponse.json(addedComment, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}