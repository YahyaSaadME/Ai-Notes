"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Calendar,
  Tag,
  MessageSquare,
  X,
  Send,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  CheckCircle,
  Mic,
  MicOff,
} from "lucide-react";
import { notesApi, commentsApi, usersApi, projectsApi } from "@/lib/notesApi";
import { Note, Comment, CreateNoteData, NotesFilters, NotesResponse } from "@/types/notes";
import DashboardLayout from "../components/DashboardLayout";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface CommentItemProps {
  comment: Comment;
  noteId: string;
  onReply: (commentId: string, replyText: string, isPrivate: boolean, privateUsers?: string[]) => void;
  onEdit: (commentId: string, newText: string, isPrivate: boolean, isReply?: boolean, parentCommentId?: string, privateUsers?: string[]) => void;
  onDelete: (commentId: string, isReply?: boolean, parentCommentId?: string) => void;
  expandedComments: { [key: string]: boolean };
  toggleExpansion: (commentId: string) => void;
  formatDate: (dateString: string) => string;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  noteId,
  onReply,
  onEdit,
  onDelete,
  expandedComments,
  toggleExpansion,
  formatDate,
  level = 0,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.text);
  const [replyPrivate, setReplyPrivate] = useState(false);
  const [editPrivate, setEditPrivate] = useState(comment.isPrivate);
  const [replyPrivateUsers, setReplyPrivateUsers] = useState<string[]>([]);
  const [editPrivateUsers, setEditPrivateUsers] = useState<string[]>(comment.privateUsers || []);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<Array<{ _id: string; name: string; email: string; role: string }>>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [privateUserNames, setPrivateUserNames] = useState<{ [userId: string]: string }>({});

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await onReply(comment._id, replyText, replyPrivate, replyPrivate ? replyPrivateUsers : undefined);
    setReplyText("");
    setReplyPrivate(false);
    setReplyPrivateUsers([]);
    setIsReplying(false);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(comment._id, editText, editPrivate, level > 0, level > 0 ? comment._id : undefined, editPrivate ? editPrivateUsers : undefined);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(comment._id, level > 0, level > 0 ? comment._id : undefined);
  };

  const handleUserSearch = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    try {
      const results = await usersApi.searchUsers(query);
      setUserSearchResults(results.users);
    } catch (error) {
      console.error("Error searching users:", error);
      setUserSearchResults([]);
    }
  };

  const toggleUserSelection = (userId: string, isForReply: boolean = false) => {
    if (isForReply) {
      setReplyPrivateUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    } else {
      setEditPrivateUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  // Load user names for private comments
  useEffect(() => {
    const loadPrivateUserNames = async () => {
      if (comment.isPrivate && comment.privateUsers && comment.privateUsers.length > 0) {
        try {
          const result = await usersApi.getUsersByIds(comment.privateUsers);
          const names: { [userId: string]: string } = {};
          result.users.forEach(user => {
            names[user._id] = user.name;
          });
          setPrivateUserNames(names);
        } catch (error) {
          console.error("Error loading private user names:", error);
        }
      }
    };

    loadPrivateUserNames();
  }, [comment.isPrivate, comment.privateUsers]);

  const maxDepth = 3; // Limit nesting depth
  const canReply = level < maxDepth;

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className={`border border-gray-200 rounded-lg p-4 ${comment.isPrivate ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
        {comment.isPrivate && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-yellow-700 font-medium">Private</span>
            {comment.privateUsers && comment.privateUsers.length > 0 && (
              <span className="text-xs text-yellow-600">
                (Shared with: {comment.privateUsers.map(userId => privateUserNames[userId] || 'Loading...').join(', ')})
              </span>
            )}
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={3}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editPrivate}
                onChange={(e) => setEditPrivate(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-600">Private comment</span>
            </label>
            {editPrivate && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Share with specific users:</label>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    handleUserSearch(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                {userSearchResults.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    {userSearchResults.map((user) => (
                      <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPrivateUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id, false)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <div>
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-xs text-gray-500 ml-1">({user.email})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {editPrivateUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editPrivateUsers.map((userId) => {
                      const user = userSearchResults.find(u => u._id === userId);
                      return (
                        <span key={userId} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {user ? user.name : 'Unknown User'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={!editText.trim()}
                className="px-3 py-1 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-3">{comment.text}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDate(comment.createdAt)}</span>
                <span>by {comment.createdBy}</span>
              </div>
              <div className="flex items-center gap-1">
                {canReply && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Reply"
                  >
                    <MessageSquare size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
                {comment.replies && comment.replies.length > 0 && (
                  <button
                    onClick={() => toggleExpansion(comment._id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs"
                  >
                    {expandedComments[comment._id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            </div>

            {isReplying && canReply && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                    rows={2}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={replyPrivate}
                      onChange={(e) => setReplyPrivate(e.target.checked)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-600">Private reply</span>
                  </label>
                  {replyPrivate && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Share with specific users:</label>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          handleUserSearch(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      {userSearchResults.length > 0 && (
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                          {userSearchResults.map((user) => (
                            <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={replyPrivateUsers.includes(user._id)}
                                onChange={() => toggleUserSelection(user._id, true)}
                                className="rounded border-gray-300 text-black focus:ring-black"
                              />
                              <div>
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500 ml-1">({user.email})</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      {replyPrivateUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {replyPrivateUsers.map((userId) => {
                            const user = userSearchResults.find(u => u._id === userId);
                            return (
                              <span key={userId} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {user ? user.name : 'Unknown User'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="px-3 py-1 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => setIsReplying(false)}
                      className="px-3 py-1 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {expandedComments[comment._id] && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              noteId={noteId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedComments={expandedComments}
              toggleExpansion={toggleExpansion}
              formatDate={formatDate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Notespage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notesResponse, setNotesResponse] = useState<NotesResponse | null>(null);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<NotesFilters>({
    type: "work",
    completed: "false",
    prioritize: "",
    tags: "",
    date: "",
    deadline: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 12,
  });
  const [projects, setProjects] = useState<Array<{ _id: string; title: string; description?: string; tags?: string[] }>>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newCommentPrivate, setNewCommentPrivate] = useState(false);
  const [newCommentPrivateUsers, setNewCommentPrivateUsers] = useState<string[]>([]);
  const [newCommentUserSearchQuery, setNewCommentUserSearchQuery] = useState("");
  const [newCommentUserSearchResults, setNewCommentUserSearchResults] = useState<Array<{ _id: string; name: string; email: string; role: string }>>([]);
  const [expandedComments, setExpandedComments] = useState<{
    [key: string]: boolean;
  }>({});
  const [newNote, setNewNote] = useState<CreateNoteData>({
    title: "",
    description: "",
    type: "personal",
    deadline: "",
    tags: "",
    prioritize: false,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectPage, setProjectPage] = useState(1);
  const projectsPerPage = 10;

  // Speech-to-Text states
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const finalTranscriptsRef = useRef<string[]>([]);

  // Function to update URL with current filters and search
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (filters.type && filters.type !== 'work') params.set('type', filters.type);
    if (filters.completed) params.set('completed', filters.completed);
    if (filters.prioritize) params.set('prioritize', filters.prioritize);
    if (filters.tags) params.set('tags', filters.tags);
    if (filters.date) params.set('date', filters.date);
    if (filters.deadline) params.set('deadline', filters.deadline);
    if (filters.sortBy !== 'createdAt') params.set('sortBy', filters.sortBy);
    if (filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder);
    if (filters.page > 1) params.set('page', filters.page.toString());

    const query = params.toString();
    const newUrl = query ? `/notes?${query}` : '/notes';
    router.replace(newUrl, { scroll: false });
  }, [searchTerm, filters, router]);

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    const initialSearch = params.get('search') || '';
    const initialType = params.get('type') || 'work';
    const initialCompleted = params.get('completed') || 'false';
    const initialPrioritize = params.get('prioritize') || '';
    const initialTags = params.get('tags') || '';
    const initialDate = params.get('date') || '';
    const initialDeadline = params.get('deadline') || '';
    const initialSortBy = params.get('sortBy') || 'createdAt';
    const initialSortOrder = params.get('sortOrder') || 'desc';
    const initialPage = parseInt(params.get('page') || '1');

    setSearchTerm(initialSearch);
    setSearchInput(initialSearch);
    setFilters({
      type: initialType,
      completed: initialCompleted,
      prioritize: initialPrioritize,
      tags: initialTags,
      date: initialDate,
      deadline: initialDeadline,
      sortBy: initialSortBy,
      sortOrder: initialSortOrder,
      page: initialPage,
      limit: 12,
    });
  }, [searchParams]);

  // Sync searchInput with searchTerm
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (event: any) => {
          const newFinals: string[] = [];
          let currentInterim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinals.push(transcript);
            } else {
              currentInterim = transcript;
            }
          }
          finalTranscriptsRef.current = [
            ...finalTranscriptsRef.current,
            ...newFinals,
          ];
          setInterimTranscript(currentInterim);
          const fullText =
            finalTranscriptsRef.current.join(" ") +
            (currentInterim ? " " + currentInterim : "");
          setTranscribedText(fullText);
          setSearchInput(fullText); // Update search input with transcribed text
        };
        rec.onend = () => setIsRecording(false);
        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };
        setRecognition(rec);
      }
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notesApi.getNotes({ ...filters, search: searchTerm });
      setNotesResponse(response);
      setFilteredNotes(response.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
      console.error("Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  const loadProjects = useCallback(async () => {
    try {
      const projectsData = await projectsApi.getProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }, []);

  const clearAllFilters = () => {
    setFilters({
      type: "work",
      completed: "",
      prioritize: "",
      tags: "",
      date: "",
      deadline: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 12,
    });
    setSearchTerm("");
    setSearchInput("");
    setProjectPage(1);
  };

  const toggleRecording = () => {
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
      // Apply the transcribed text to search when recording stops
      if (transcribedText.trim()) {
        setSearchTerm(transcribedText.trim());
      }
    } else {
      finalTranscriptsRef.current = [];
      setInterimTranscript("");
      setTranscribedText("");
      recognition.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    // Reset project page when search term changes
    setProjectPage(1);
  }, [searchTerm]);

  // Update URL when filters or search change (skip on initial load)
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  const handleProjectClick = (projectTitle: string) => {
    // Set the search term to the project title to filter notes
    setSearchTerm(projectTitle);
    setSearchInput(projectTitle);
    // Reset to first page when filtering
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleProjectPageChange = (newPage: number) => {
    setProjectPage(newPage);
  };

  const paginatedProjects = projects.slice(
    (projectPage - 1) * projectsPerPage,
    projectPage * projectsPerPage
  );

  const totalProjectPages = Math.ceil(projects.length / projectsPerPage);

  const openNoteModal = async (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
    setCommentsPage(1); // Reset to first page
    try {
      const noteComments = await commentsApi.getComments(note._id);
      setComments(noteComments);
    } catch (err) {
      console.error("Error loading comments:", err);
      setComments([]);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
    setComments([]);
    setNewComment("");
    setNewCommentPrivate(false);
    setNewCommentPrivateUsers([]);
    setNewCommentUserSearchQuery("");
    setNewCommentUserSearchResults([]);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewNote({
      title: "",
      description: "",
      type: "personal",
      deadline: "",
      tags: "",
      prioritize: false,
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNote(null);
    setNewNote({
      title: "",
      description: "",
      type: "personal",
      deadline: "",
      tags: "",
      prioritize: false,
    });
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;

    try {
      setLoading(true);
      await notesApi.createNote(newNote);
      await loadNotes(); // Reload notes to get updated pagination
      closeCreateModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
      console.error("Error creating note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !newNote.title.trim()) return;

    try {
      setLoading(true);
      const updatedNote = await notesApi.updateNote(editingNote._id, {
        ...newNote,
        tags: newNote.tags
          ? newNote.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      });
      await loadNotes(); // Reload notes to get updated data
      if (selectedNote && selectedNote._id === editingNote._id) {
        setSelectedNote(updatedNote); // Update the selected note in modal
      }
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
      console.error("Error updating note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      setLoading(true);
      await notesApi.deleteNote(noteId);
      await loadNotes(); // Reload notes to get updated pagination
      closeModal(); // Close modal after deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
      console.error("Error deleting note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (noteId: string, currentCompleted: boolean) => {
    try {
      setLoading(true);
      const updatedNote = await notesApi.updateNote(noteId, { completed: !currentCompleted });
      await loadNotes(); // Reload notes to get updated data
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote(updatedNote); // Update the selected note in modal
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
      console.error("Error updating note:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      description: note.description,
      type: note.type,
      deadline: note.deadline || "",
      tags: note.tags.join(", "),
      prioritize: note.prioritize,
    });
    setIsEditModalOpen(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedNote) return;

    try {
      const comment = await commentsApi.createComment(selectedNote._id, {
        text: newComment,
        isPrivate: newCommentPrivate,
        privateUsers: newCommentPrivate ? newCommentPrivateUsers : undefined,
      });
      setComments([...comments, comment]);
      setNewComment("");
      setNewCommentPrivate(false);
      setNewCommentPrivateUsers([]);
      setNewCommentUserSearchQuery("");
      setNewCommentUserSearchResults([]);
      setCommentsPage(1); // Reset to first page when new comment is added
    } catch (err) {
      console.error("Error adding comment:", err);
      // You might want to show an error message to the user
    }
  };

  const handleAddReply = async (commentId: string, replyText: string, isPrivate: boolean, privateUsers?: string[]) => {
    if (!replyText.trim() || !selectedNote) return;

    try {
      const reply = await commentsApi.createReply(selectedNote._id, commentId, {
        text: replyText,
        isPrivate,
        privateUsers,
      });
      
      // Update the comments state to include the new reply
      setComments(comments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply]
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  const handleEditComment = async (commentId: string, newText: string, isPrivate: boolean, isReply: boolean = false, parentCommentId?: string, privateUsers?: string[]) => {
    if (!newText.trim() || !selectedNote) return;

    try {
      if (isReply && parentCommentId) {
        await commentsApi.updateReply(selectedNote._id, parentCommentId, commentId, {
          text: newText,
          isPrivate,
          privateUsers,
        });
        
        // Update the reply in state
        setComments(comments.map(comment => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: comment.replies?.map(reply => 
                reply._id === commentId 
                  ? { ...reply, text: newText, isPrivate, privateUsers }
                  : reply
              ) || []
            };
          }
          return comment;
        }));
      } else {
        await commentsApi.updateComment(selectedNote._id, commentId, {
          text: newText,
          isPrivate,
          privateUsers,
        });
        
        // Update the comment in state
        setComments(comments.map(comment => 
          comment._id === commentId 
            ? { ...comment, text: newText, isPrivate, privateUsers }
            : comment
        ));
      }
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentCommentId?: string) => {
    if (!selectedNote) return;
    
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      if (isReply && parentCommentId) {
        await commentsApi.deleteReply(selectedNote._id, parentCommentId, commentId);
        
        // Remove the reply from state
        setComments(comments.map(comment => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: comment.replies?.filter(reply => reply._id !== commentId) || []
            };
          }
          return comment;
        }));
      } else {
        await commentsApi.deleteComment(selectedNote._id, commentId);
        
        // Remove the comment from state
        setComments(comments.filter(comment => comment._id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const handleNewCommentUserSearch = async (query: string) => {
    if (query.length < 2) {
      setNewCommentUserSearchResults([]);
      return;
    }
    try {
      const results = await usersApi.searchUsers(query);
      setNewCommentUserSearchResults(results.users);
    } catch (error) {
      console.error("Error searching users:", error);
      setNewCommentUserSearchResults([]);
    }
  };

  const toggleNewCommentUserSelection = (userId: string) => {
    setNewCommentPrivateUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
              <button
                onClick={() => setError(null)}
                className="float-right ml-4"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 text-gray-800">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="space-y-4">
              {/* Search Bar - Full Width */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={isRecording ? "Listening... Speak now!" : "Search notes or speak to search..."}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(searchInput);
                    }
                  }}
                  onBlur={() => setSearchTerm(searchInput)}
                  className={`w-full pl-10 pr-16 py-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isRecording ? 'bg-red-50 border-red-200' : ''
                  }`}
                />
                <button
                  onClick={toggleRecording}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "text-red-600 bg-red-100 hover:bg-red-200"
                      : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title={isRecording ? "Stop recording" : "Start voice search"}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                {/* {isRecording && (
                  <div className="absolute -bottom-8 left-0 flex items-center gap-2 text-sm text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Recording... Speak clearly
                  </div>
                )} */}
              </div>

              {/* Filters - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))
                  }
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>

                <select
                  value={filters.completed}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      completed: e.target.value,
                      page: 1,
                    }))
                  }
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="false">Pending</option>
                  <option value="true">Completed</option>
                </select>

                <select
                  value={filters.prioritize}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      prioritize: e.target.value,
                      page: 1,
                    }))
                  }
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Priority</option>
                  <option value="true">High Priority</option>
                  <option value="false">Normal Priority</option>
                </select>

                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      date: e.target.value,
                      page: 1,
                    }))
                  }
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Created date"
                />

                <input
                  type="date"
                  value={filters.deadline}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                      page: 1,
                    }))
                  }
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Deadline date"
                />

                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
                  }}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="deadline-asc">Deadline Soon</option>
                </select>

                <button
                  onClick={clearAllFilters}
                  className="px-4 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  title="Clear all filters"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>

                <button
                  onClick={openCreateModal}
                  disabled={loading}
                  className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">New Note</span>
                </button>
              </div>
            </div>
            {/* Projects List */}
          {projects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {paginatedProjects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => handleProjectClick(project.title)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm hover:bg-blue-100 transition-colors"
                    title={project.description || project.title}
                  >
                    {project.title}
                  </button>
                ))}
              </div>
          )}

          {/* Projects Pagination */}
          {projects.length > projectsPerPage && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {((projectPage - 1) * projectsPerPage) + 1} to {Math.min(projectPage * projectsPerPage, projects.length)} of {projects.length} projects
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProjectPageChange(projectPage - 1)}
                  disabled={projectPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {projectPage} of {totalProjectPages}
                </span>
                <button
                  onClick={() => handleProjectPageChange(projectPage + 1)}
                  disabled={projectPage === totalProjectPages}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </div>

          

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 cursor-pointer ${
                  note.prioritize
                    ? "ring-2 ring-orange-100 border-orange-200"
                    : ""
                }`}
                onClick={() => openNoteModal(note)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 text-lg leading-tight flex-1 mr-2">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {note.prioritize && (
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompleted(note._id, note.completed);
                      }}
                      className={`p-1 transition-colors ${
                        note.completed
                          ? "text-green-600 hover:text-green-700"
                          : "text-gray-400 hover:text-green-600"
                      }`}
                      title={note.completed ? "Mark as pending" : "Mark as completed"}
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(note);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit note"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note._id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {note.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                 

                  {note.deadline && (
                    <div
                      className={`flex items-center gap-1 ${
                        isDeadlineNear(note.deadline)
                          ? "text-orange-600"
                          : "text-gray-500"
                      }`}
                    >
                      <Calendar size={12} />
                      <span>{formatDate(note.deadline)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MessageSquare size={12} />
                    <span>{note.comments?.length || 0} comments</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {notesResponse && notesResponse.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
              <div className="text-sm text-gray-600">
                Showing {((filters.page! - 1) * filters.limit!) + 1} to {Math.min(filters.page! * filters.limit!, notesResponse.total)} of {notesResponse.total} notes
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {filters.page} of {notesResponse.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === notesResponse.totalPages}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {filteredNotes.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No notes found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notes...</p>
            </div>
          )}
        </div>

        {/* Note Detail Modal */}
        {isModalOpen && selectedNote && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex h-[90vh]">
                {/* Left Side - Note Details (50%) */}
                <div className="w-1/2 p-6 border-r border-gray-200 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex-1 mr-4">
                      {selectedNote.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(selectedNote)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit note"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(selectedNote._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={closeModal}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedNote.type === "work"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {selectedNote.type}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedNote.completed
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {selectedNote.completed ? "Completed" : "Pending"}
                        </span>
                        {selectedNote.prioritize && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                            High Priority
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        {selectedNote.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Created
                          </label>
                          <p className="text-sm text-gray-900">{formatDate(selectedNote.createdAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Last Updated
                          </label>
                          <p className="text-sm text-gray-900">{formatDate(selectedNote.updatedAt)}</p>
                        </div>
                        {selectedNote.deadline && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                Deadline
                              </label>
                              <p className={`text-sm ${isDeadlineNear(selectedNote.deadline) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                                {formatDate(selectedNote.deadline)}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                Days Remaining
                              </label>
                              <p className={`text-sm ${isDeadlineNear(selectedNote.deadline) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                                {selectedNote.deadline ? Math.ceil((new Date(selectedNote.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'} days
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedNote.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                            >
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                          {selectedNote.tags.length === 0 && (
                            <span className="text-gray-400 text-sm">No tags</span>
                          )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Created By
                        </label>
                        <p className="text-sm text-gray-900">{selectedNote.createdby}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleCompleted(selectedNote._id, selectedNote.completed)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedNote.completed
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          }`}
                        >
                          <CheckCircle size={16} />
                          {selectedNote.completed ? "Mark as Pending" : "Mark as Completed"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Comments (50%) */}
                <div className="w-1/2 flex flex-col">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <MessageSquare size={18} />
                      Comments ({comments.length})
                    </h3>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments
                          .slice()
                          .reverse()
                          .slice(
                            (commentsPage - 1) * commentsPerPage,
                            commentsPage * commentsPerPage
                          )
                          .map((comment) => (
                            <CommentItem
                              key={comment._id}
                              comment={comment}
                              noteId={selectedNote._id}
                              onReply={handleAddReply}
                              onEdit={handleEditComment}
                              onDelete={handleDeleteComment}
                              expandedComments={expandedComments}
                              toggleExpansion={toggleCommentExpansion}
                              formatDate={formatDate}
                            />
                          ))}
                      </div>

                      {/* Pagination */}
                      {comments.length > commentsPerPage && (
                        <div className="p-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() =>
                                setCommentsPage(Math.max(1, commentsPage - 1))
                              }
                              disabled={commentsPage === 1}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {commentsPage} of{" "}
                              {Math.ceil(comments.length / commentsPerPage)}
                            </span>
                            <button
                              onClick={() =>
                                setCommentsPage(
                                  Math.min(
                                    Math.ceil(
                                      comments.length / commentsPerPage
                                    ),
                                    commentsPage + 1
                                  )
                                )
                              }
                              disabled={
                                commentsPage ===
                                Math.ceil(comments.length / commentsPerPage)
                              }
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="p-4 border-t border-gray-200 text-gray-900">
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleAddComment()
                              }
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newCommentPrivate}
                              onChange={(e) => setNewCommentPrivate(e.target.checked)}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className="text-sm text-gray-600">Private comment</span>
                          </label>
                          {newCommentPrivate && (
                            <div className="space-y-2">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search users to share with..."
                                  value={newCommentUserSearchQuery}
                                  onChange={(e) => {
                                    setNewCommentUserSearchQuery(e.target.value);
                                    handleNewCommentUserSearch(e.target.value);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                {newCommentUserSearchResults.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {newCommentUserSearchResults.map((user) => (
                                      <div
                                        key={user._id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => toggleNewCommentUserSelection(user._id)}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={newCommentPrivateUsers.includes(user._id)}
                                          onChange={() => toggleNewCommentUserSelection(user._id)}
                                          className="rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <div>
                                          <div className="text-sm font-medium">{user.name}</div>
                                          <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {newCommentPrivateUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {newCommentPrivateUsers.map((userId) => {
                                    const user = newCommentUserSearchResults.find(u => u._id === userId);
                                    return (
                                      <span
                                        key={userId}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                      >
                                        {user?.name || 'Unknown User'}
                                        <button
                                          onClick={() => toggleNewCommentUserSelection(userId)}
                                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                        >
                                          <X size={10} />
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Note Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-white text-gray-800 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Note
                </h2>
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
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg "
                />

                <textarea
                  placeholder="Description"
                  value={newNote.description}
                  onChange={(e) =>
                    setNewNote((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg  resize-none"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newNote.type}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        type: e.target.value as "work" | "personal",
                      }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg "
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                  </select>

                  <input
                    type="date"
                    value={newNote.deadline}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg "
                  />
                </div>

                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newNote.tags}
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg "
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newNote.prioritize}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        prioritize: e.target.checked,
                      }))
                    }
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
                    disabled={!newNote.title.trim() || loading}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Note Modal */}
        {isEditModalOpen && editingNote && (
          <div className="fixed inset-0 bg-gray-900 text-gray-800 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Note
                </h2>
                <button
                  onClick={closeEditModal}
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
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg "
                />

                <textarea
                  placeholder="Description"
                  value={newNote.description}
                  onChange={(e) =>
                    setNewNote((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg  resize-none"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newNote.type}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        type: e.target.value as "work" | "personal",
                      }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg "
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                  </select>

                  <input
                    type="date"
                    value={newNote.deadline}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg "
                  />
                </div>

                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newNote.tags}
                  onChange={(e) =>
                    setNewNote((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg "
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newNote.prioritize}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        prioritize: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">High Priority</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditNote}
                    disabled={!newNote.title.trim() || loading}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Notespage;
