import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../../lib/mongodb'
import Note from '../../../../../../models/Note'
import { verifyToken } from '../../../../../../lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string; commentId: string }> }
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

    const { noteId, commentId } = await params

    const body = await request.json()
    const { text, isPrivate } = body

    // Check if note exists and belongs to user
    const note = await Note.findOne({
      _id: noteId,
      createdby: payload.email
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Find the comment
    const comment = note.comments.id(commentId)
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user owns the comment
    if (comment.createdBy !== payload.email) {
      return NextResponse.json({ error: 'Unauthorized to edit this comment' }, { status: 403 })
    }

    if (text !== undefined) {
      if (!text.trim()) {
        return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 })
      }
      comment.text = text.trim()
    }

    if (typeof isPrivate === 'boolean') {
      comment.isPrivate = isPrivate
    }

    await note.save()

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string; commentId: string }> }
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

    const { noteId, commentId } = await params

    // Check if note exists and belongs to user
    const note = await Note.findOne({
      _id: noteId,
      createdby: payload.email
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Find the comment
    const comment = note.comments.id(commentId)
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user owns the comment
    if (comment.createdBy !== payload.email) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 })
    }

    // Remove the comment
    note.comments.pull(commentId)
    await note.save()

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}