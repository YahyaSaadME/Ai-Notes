"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar, Tag, MessageSquare, X, Edit, Trash2, Send, ChevronDown, ChevronRight } from 'lucide-react';

interface MockReply {
  id: number
  content: string
  createdAt: string
}

interface MockComment {
  id: number
  noteId: number
  content: string
  createdAt: string
  replies: MockReply[]
}

interface MockNote {
  id: number
  title: string
  description: string
  type: 'work' | 'personal'
  completed: boolean
  prioritize: boolean
  deadline: string
  tags: string[]
  createdAt: string
}

interface MockFilters {
  type: string
  completed: string
  prioritize: string
  sortBy: string
  sortOrder: string
}

interface MockExpandedComments {
  [key: number]: boolean
}

interface MockNewNote {
  title: string
  description: string
  type: 'work' | 'personal'
  deadline: string
  tags: string
  prioritize: boolean
}

const NotesApp = () => {
  const [notes, setNotes] = useState<MockNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<MockNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<MockNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MockFilters>({
    type: '',
    completed: '',
    prioritize: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [comments, setComments] = useState<MockComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<MockExpandedComments>({});
  const [newNote, setNewNote] = useState<MockNewNote>({
    title: '',
    description: '',
    type: 'personal',
    deadline: '',
    tags: '',
    prioritize: false
  });

  // Mock data for demonstration
  const mockNotes: MockNote[] = [
    {
      id: 1,
      title: "Project Planning Meeting",
      description: "Discuss Q4 roadmap and resource allocation for the upcoming product launch.",
      type: "work",
      completed: false,
      prioritize: true,
      deadline: "2024-10-15",
      tags: ["meeting", "planning", "q4"],
      createdAt: "2024-09-20T10:00:00Z"
    },
    {
      id: 2,
      title: "Grocery Shopping",
      description: "Buy ingredients for weekend dinner party: salmon, vegetables, wine, dessert items.",
      type: "personal",
      completed: false,
      prioritize: false,
      deadline: "2024-09-25",
      tags: ["shopping", "food"],
      createdAt: "2024-09-21T14:30:00Z"
    },
    {
      id: 3,
      title: "Code Review Session",
      description: "Review pull requests for authentication system and database optimization updates.",
      type: "work",
      completed: true,
      prioritize: false,
      deadline: "",
      tags: ["code", "review", "development"],
      createdAt: "2024-09-19T09:15:00Z"
    },
    {
      id: 4,
      title: "Book Club Discussion",
      description: "Monthly book club meeting to discuss 'The Design of Everyday Things'",
      type: "personal",
      completed: false,
      prioritize: false,
      deadline: "2024-09-28",
      tags: ["reading", "social"],
      createdAt: "2024-09-22T16:45:00Z"
    }
  ];

  const mockComments: MockComment[] = [
    {
      id: 1,
      noteId: 1,
      content: "Should we include the marketing team in this discussion?",
      createdAt: "2024-09-21T11:00:00Z",
      replies: [
        {
          id: 1,
          content: "Yes, let's add Sarah from marketing to the invite list.",
          createdAt: "2024-09-21T11:15:00Z"
        }
      ]
    },
    {
      id: 2,
      noteId: 1,
      content: "Don't forget to prepare the budget projections slides.",
      createdAt: "2024-09-21T12:30:00Z",
      replies: []
    }
  ];

  useEffect(() => {
    // In a real app, this would be an API call
    setNotes(mockNotes);
    setFilteredNotes(mockNotes);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, notes]);

  const applyFilters = () => {
    let filtered = [...notes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(note => note.type === filters.type);
    }

    // Completed filter
    if (filters.completed !== '') {
      filtered = filtered.filter(note => note.completed.toString() === filters.completed);
    }

    // Priority filter
    if (filters.prioritize !== '') {
      filtered = filtered.filter(note => note.prioritize.toString() === filters.prioritize);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (filters.sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'deadline':
          aVal = a.deadline || '9999-12-31';
          bVal = b.deadline || '9999-12-31';
          break;
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }
      
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredNotes(filtered);
  };

  const openNoteModal = (note: MockNote) => {
    setSelectedNote(note);
    setIsModalOpen(true);
    // Load comments for this note
    const noteComments = mockComments.filter(comment => comment.noteId === note.id);
    setComments(noteComments);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
    setComments([]);
    setNewComment('');
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewNote({
      title: '',
      description: '',
      type: 'personal',
      deadline: '',
      tags: '',
      prioritize: false
    });
  };

  const handleCreateNote = () => {
    const noteToCreate = {
      ...newNote,
      id: Date.now(),
      completed: false,
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date().toISOString()
    };
    
    setNotes([noteToCreate, ...notes]);
    closeCreateModal();
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedNote) return;
    
    const comment = {
      id: Date.now(),
      noteId: selectedNote.id,
      content: newComment,
      createdAt: new Date().toISOString(),
      replies: []
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  };

  const toggleCommentExpansion = (commentId: number) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isDeadlineNear = (deadline: string) => {
    if (!deadline) return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-light text-gray-900">Notes</h1>
              <p className="text-sm text-gray-500 mt-1">Organize your thoughts and tasks</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={16} />
              New Note
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="">All Types</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
              
              <select
                value={filters.completed}
                onChange={(e) => setFilters(prev => ({ ...prev, completed: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="false">Pending</option>
                <option value="true">Completed</option>
              </select>
              
              <select
                value={filters.prioritize}
                onChange={(e) => setFilters(prev => ({ ...prev, prioritize: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="">All Priority</option>
                <option value="true">High Priority</option>
                <option value="false">Normal Priority</option>
              </select>
              
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="deadline-asc">Deadline Soon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNoteModal(note)}
              className={`bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-gray-300 ${
                note.prioritize ? 'ring-2 ring-orange-100 border-orange-200' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-gray-900 text-lg leading-tight">{note.title}</h3>
                {note.prioritize && (
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 mt-1"></div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{note.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded ${
                    note.type === 'work' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {note.type}
                  </span>
                  {note.completed && (
                    <span className="text-green-600 font-medium">✓ Done</span>
                  )}
                </div>
                
                {note.deadline && (
                  <div className={`flex items-center gap-1 ${
                    isDeadlineNear(note.deadline) ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    <Calendar size={12} />
                    <span>{formatDate(note.deadline)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No notes found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      {isModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{selectedNote.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">{selectedNote.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <span className={`px-3 py-1 rounded ${
                    selectedNote.type === 'work' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedNote.type}
                  </span>
                  
                  {selectedNote.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Due: {formatDate(selectedNote.deadline)}
                    </span>
                  )}
                  
                  {selectedNote.prioritize && (
                    <span className="text-orange-600 font-medium">High Priority</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      <Tag size={12} className="inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Comments ({comments.length})
                </h3>
                
                <div className="space-y-4 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(comment.createdAt)}</span>
                        {comment.replies.length > 0 && (
                          <button
                            onClick={() => toggleCommentExpansion(comment.id)}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            {expandedComments[comment.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            {comment.replies.length} replies
                          </button>
                        )}
                      </div>
                      
                      {expandedComments[comment.id] && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-100 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded p-3">
                              <p className="text-gray-700 text-sm mb-1">{reply.content}</p>
                              <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Note</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              
              <textarea
                placeholder="Description"
                value={newNote.description}
                onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newNote.type}
                  onChange={(e) =>
                    setNewNote(prev => ({
                      ...prev,
                      type: e.target.value as MockNewNote['type'],
                    }))
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                </select>
                
                <input
                  type="date"
                  value={newNote.deadline}
                  onChange={(e) => setNewNote(prev => ({ ...prev, deadline: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newNote.tags}
                onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newNote.prioritize}
                  onChange={(e) => setNewNote(prev => ({ ...prev, prioritize: e.target.checked }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">High Priority</span>
              </label>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeCreateModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.title.trim()}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesApp;
