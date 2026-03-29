import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { transcription, type = 'personal' } = await request.json()

    if (!transcription) {
      return NextResponse.json({ error: 'Transcription is required' }, { status: 400 })
    }

    // Generate date strings for context
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // AI prompt for generating structured notes
    const noteGenerationPrompt = `
You are an intelligent note generation assistant. Analyze the transcription and extract multiple actionable notes if present.

RULES:
1. Split content into separate notes if multiple distinct topics/tasks are mentioned
2. Create clear, concise titles (max 60 characters)
3. Extract relevant details for each note
4. Identify type: "work" or "personal"
5. Detect priority level: true for urgent/important items
6. Parse deadlines from date mentions
7. Extract relevant tags/categories

DATE PARSING:
- Current date: ${todayStr}
- Tomorrow: ${tomorrowStr}
- Handle relative dates: "tomorrow", "next week", "Friday", etc.
- Convert to YYYY-MM-DD format

EXAMPLES:
Input: "Remember to call mom tomorrow and finish the quarterly report by Friday, also buy groceries"
Output: [
  {
    "title": "Call Mom",
    "description": "Remember to call mom",
    "type": "personal",
    "deadline": "${tomorrowStr}",
    "prioritize": false,
    "tags": "family, call"
  },
  {
    "title": "Finish Quarterly Report",
    "description": "Complete the quarterly report",
    "type": "work", 
    "deadline": "2025-10-11",
    "prioritize": true,
    "tags": "report, quarterly, deadline"
  },
  {
    "title": "Buy Groceries",
    "description": "Buy groceries",
    "type": "personal",
    "deadline": "",
    "prioritize": false,
    "tags": "shopping, groceries"
  }
]

Input: "Meeting with client about project requirements tomorrow at 2pm"
Output: [
  {
    "title": "Client Meeting - Project Requirements",
    "description": "Meeting with client about project requirements at 2pm",
    "type": "work",
    "deadline": "${tomorrowStr}",
    "prioritize": true,
    "tags": "meeting, client, requirements"
  }
]

Transcription: "${transcription}"

Return ONLY valid JSON array of note objects. Each note must have: title, description, type, deadline, prioritize, tags.
`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: noteGenerationPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 })
    }

    let notes
    try {
      notes = JSON.parse(response.trim())
      
      // Ensure it's an array
      if (!Array.isArray(notes)) {
        notes = [notes]
      }

      // Validate and sanitize each note according to schema
      notes = notes.map((note, index) => ({
        title: note.title || `Note ${index + 1}`,
        description: note.description || transcription,
        type: note.type === 'work' ? 'work' : 'personal',
        deadline: note.deadline ? new Date(note.deadline) : null,
        completed: false,
        prioritize: Boolean(note.prioritize),
        tags: note.tags ? note.tags.split(',').map((tag: string) => tag.trim().toLowerCase()) : [],
      }))

    } catch (error) {
      console.error('Failed to parse AI response:', error)
      
      // Fallback: create a single note from transcription
      notes = [{
        title: transcription.length > 50 ? transcription.substring(0, 50) + '...' : transcription,
        description: transcription,
        type: type,
        deadline: null,
        completed: false,
        prioritize: false,
        tags: [],
      }]
    }

    console.log('Generated notes:', notes)

    return NextResponse.json({
      success: true,
      notes: notes,
      count: notes.length,
      message: `Generated ${notes.length} note${notes.length > 1 ? 's' : ''} from transcription`
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}