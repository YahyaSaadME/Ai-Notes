import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../../../lib/mongodb'
import Note from '../../../../../../../models/Note'
import { verifyToken } from '../../../../../../../lib/auth'
import { getNoteUpdateScope } from '@/lib/rbac'

function scopedQuery(noteId: string, scope: Record<string, unknown>) {
  if (Object.keys(scope).length === 0) {
    return { _id: noteId }
  }

  return {
    $and: [
      { _id: noteId },
      scope,
    ],
  }
}

export async function POST(
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
    const updateScope = getNoteUpdateScope(payload)

    if (!updateScope) {
      return NextResponse.json({ error: 'Role is not allowed to add replies' }, { status: 403 })
    }

    const body = await request.json()
    const { text, isPrivate, privateUsers } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
    }

    // Check if note exists and belongs to user
    const note = await Note.findOne(scopedQuery(noteId, updateScope))

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Find the comment
    const comment = note.comments.id(commentId)
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const newReply = {
      text: text.trim(),
      createdBy: payload.email,
      isPrivate: Boolean(isPrivate),
      privateUsers: Array.isArray(privateUsers)
        ? privateUsers.map((user: string) => String(user).trim().toLowerCase()).filter(Boolean)
        : [],
      replies: []
    }

    comment.replies.push(newReply)
    await note.save()

    // Return the newly added reply
    const addedReply = comment.replies[comment.replies.length - 1]

    return NextResponse.json(addedReply, { status: 201 })
  } catch (error) {
    console.error('Error adding reply:', error)
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 })
  }
}