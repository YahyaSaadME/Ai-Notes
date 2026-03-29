import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../../../../lib/mongodb'
import Note from '../../../../../../../../models/Note'
import { verifyToken } from '../../../../../../../../lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string; commentId: string; replyId: string }> }
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

    const { noteId, commentId, replyId } = await params

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

    // Find the reply within the comment's replies
    const reply = comment.replies.id(replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Check if user owns the reply
    if (reply.createdBy !== payload.email) {
      return NextResponse.json({ error: 'Unauthorized to edit this reply' }, { status: 403 })
    }

    if (text !== undefined) {
      if (!text.trim()) {
        return NextResponse.json({ error: 'Reply text cannot be empty' }, { status: 400 })
      }
      reply.text = text.trim()
    }

    if (typeof isPrivate === 'boolean') {
      reply.isPrivate = isPrivate
    }

    await note.save()

    return NextResponse.json(reply)
  } catch (error) {
    console.error('Error updating reply:', error)
    return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string; commentId: string; replyId: string }> }
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

    const { noteId, commentId, replyId } = await params

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

    // Find the reply within the comment's replies
    const reply = comment.replies.id(replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    // Check if user owns the reply
    if (reply.createdBy !== payload.email) {
      return NextResponse.json({ error: 'Unauthorized to delete this reply' }, { status: 403 })
    }

    // Remove the reply
    comment.replies.pull(replyId)
    await note.save()

    return NextResponse.json({ message: 'Reply deleted successfully' })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 })
  }
}