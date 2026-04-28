import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Note from '../../../../models/Note'
import User from '../../../../models/User'
import { verifyToken } from '../../../../lib/auth'
import { getNoteDeleteScope, getNoteReadScope, getNoteUpdateScope } from '@/lib/rbac'

type UserEmailLookup = {
  email?: string
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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
    const readScope = getNoteReadScope(payload)

    const note = await Note.findOne(scopedQuery(noteId, readScope))

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
    const updateScope = getNoteUpdateScope(payload)

    if (!updateScope) {
      return NextResponse.json({ error: 'Role is not allowed to update notes' }, { status: 403 })
    }

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

    // Fetch existing note to get current values
    const existingNote = await Note.findOne(scopedQuery(noteId, updateScope))

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

    if (workflowStatus && !['backlog', 'in_progress', 'review', 'done'].includes(workflowStatus)) {
      return NextResponse.json({ error: 'Invalid workflow status' }, { status: 400 })
    }

    if (visibility && !['org', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
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

    if (workflowStatus !== undefined) {
      updateData.workflowStatus = workflowStatus
    }

    if (visibility !== undefined) {
      updateData.visibility = visibility
    }

    if (assignedTo !== undefined) {
      const normalizedAssignee = String(assignedTo || '').trim()

      if (!normalizedAssignee) {
        updateData.assignedTo = undefined
      } else if (normalizedAssignee.includes('@')) {
        updateData.assignedTo = normalizedAssignee.toLowerCase()
      } else {
        const exactNameRegex = new RegExp(`^${escapeRegex(normalizedAssignee)}$`, 'i')
        const matchedUser = await User.findOne<UserEmailLookup>({ name: { $regex: exactNameRegex } })
          .select('email')
          .lean()

        if (!matchedUser?.email) {
          return NextResponse.json({ error: 'Assigned user name not found' }, { status: 400 })
        }

        updateData.assignedTo = String(matchedUser.email).toLowerCase()
      }
    }

    const note = await Note.findOneAndUpdate(
      scopedQuery(noteId, updateScope),
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
    const deleteScope = getNoteDeleteScope(payload)

    if (!deleteScope) {
      return NextResponse.json({ error: 'Role is not allowed to delete notes' }, { status: 403 })
    }

    const note = await Note.findOneAndDelete(scopedQuery(noteId, deleteScope))

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
