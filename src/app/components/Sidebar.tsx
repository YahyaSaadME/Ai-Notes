"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  Users,
  LogOut,
  NotebookPen,
  BotOff,
  Bot,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface User {
  email: string;
  name: string;
  role: "admin" | "owner" | "manager" | "operator" | "viewer" | "user";
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);
  const finalTranscriptsRef = useRef<string[]>([]);
  const [showTranscriptionBox, setShowTranscriptionBox] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assigneeFilterInput, setAssigneeFilterInput] = useState("");
  const [tagsFilterInput, setTagsFilterInput] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/notes")) {
      setAssigneeFilterInput(searchParams.get("assignee") || "");
      setTagsFilterInput(searchParams.get("tags") || "");
    }
  }, [pathname, searchParams]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {}
    };
    if (user) {
      fetchUnread();
      timer = setInterval(fetchUnread, 30000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (event: SpeechRecognitionEventLike) => {
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
          const fullText =
            finalTranscriptsRef.current.join(" ") +
            (currentInterim ? " " + currentInterim : "");
          setTranscribedText(fullText);
        };
        rec.onend = () => setIsRecording(false);
        rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };
        setRecognition(rec);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleRecording = () => {
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
      // Auto-process transcription when recording stops
      setTimeout(() => {
        if (transcribedText.trim()) {
          generateNotes();
        }
      }, 500); // Small delay to ensure transcription is complete
    } else {
      finalTranscriptsRef.current = [];
      setTranscribedText("");
      setShowTranscriptionBox(true);
      recognition.start();
      setIsRecording(true);
    }
  };

  const generateNotes = async () => {
    if (!transcribedText.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription: transcribedText,
          type: 'personal', // Default type
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI Generated Notes:', data);

        if (data.success && data.notes && data.notes.length > 0) {
          // Save each generated note
          let savedCount = 0;
          for (const note of data.notes) {
            try {
              const noteResponse = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(note),
              });

              if (noteResponse.ok) {
                savedCount++;
              }
            } catch (error) {
              console.error("Error saving note:", error);
            }
          }

          // Show success feedback
          if (savedCount > 0) {
            console.log(`Successfully created ${savedCount} note${savedCount > 1 ? 's' : ''}`);
            // Refresh notes page if currently on it
            if (pathname === "/notes") {
              window.location.reload();
            }
          }
        }
      } else {
        console.error("Failed to generate notes");
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setIsGenerating(false);
    }

    // Clean up UI
    setShowTranscriptionBox(false);
    setTranscribedText("");
  };

  const getNavItems = () => {
    const baseItems = [
      { href: "/notes", label: "Notes", icon: NotebookPen },
      // { href: "/login", label: "Login", icon: LogOut },
    ];

    if (user && ["admin", "owner", "manager"].includes(user.role)) {
      return [
        { href: "/notes", label: "Notes", icon: NotebookPen },
        { href: "/admin/home", label: "Manage Users", icon: Users },
        // { href: "/login", label: "Login", icon: LogOut },
      ];
    } else if (user?.role === "user") {
      return baseItems;
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const updateNotesFilters = (updates: Record<string, string>) => {
    if (!pathname.startsWith("/notes")) return;

    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/notes?${query}` : "/notes", { scroll: false });
  };

  const clearSidebarFilters = () => {
    updateNotesFilters({
      type: "",
      completed: "",
      prioritize: "",
      tags: "",
      date: "",
      deadline: "",
      sortBy: "",
      sortOrder: "",
      assignee: "",
    });
    setAssigneeFilterInput("");
    setTagsFilterInput("");
  };

  const applyAssigneeFilter = () => {
    updateNotesFilters({ assignee: assigneeFilterInput.trim() });
  };

  const applyTagsFilter = () => {
    updateNotesFilters({ tags: tagsFilterInput.trim() });
  };

  return (
    <>
      <div
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } bg-black border-r border-zinc-800 transition-all duration-300 fixed h-screen flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white">AI Notes</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-300"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
          
        </div>

        {/* User Info */}

{user && !loading && (
          <div className="p-4 border-b border-zinc-800">
            {!isCollapsed && (
              <div className="flex justify-between items-start">
                <div className="text-sm">
                  <p className="font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-zinc-400 truncate">{user.email}</p>
                  <span
                    className="inline-block px-2 py-1 text-xs rounded-full mt-2 border border-zinc-700 text-zinc-200"
                  >
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center p-3 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-900 transition-colors ${
                    isRecording ? "text-white" : "text-zinc-300"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "AI Assistant" : ""}
                >
                  {isRecording ? <BotOff size={20} /> : <Bot size={20} />}
                </button>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center flex-col">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-black text-sm font-medium"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center w-full mt-3 p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-900 transition-colors ${
                    isRecording ? "text-white" : "text-zinc-300"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "AI Assistant" : ""}
                >
                  {isRecording ? <BotOff size={20}/> : <Bot size={20} />}
                </button>
              </div>
            )}
          </div>
        )}

        {pathname.startsWith("/notes") && !isCollapsed && (
          <div className="p-3 border-b border-zinc-800 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Note Filters
            </p>

            <select
              value={searchParams.get("type") || ""}
              onChange={(event) => updateNotesFilters({ type: event.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
            >
              <option value="">All Note Types</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
            </select>

            <select
              value={searchParams.get("completed") || ""}
              onChange={(event) => updateNotesFilters({ completed: event.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
            >
              <option value="">Any Completion</option>
              <option value="false">Pending</option>
              <option value="true">Completed</option>
            </select>

            <select
              value={searchParams.get("prioritize") || ""}
              onChange={(event) => updateNotesFilters({ prioritize: event.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
            >
              <option value="">Any Priority</option>
              <option value="true">High Priority</option>
              <option value="false">Normal Priority</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagsFilterInput}
                onChange={(event) => setTagsFilterInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyTagsFilter();
                  }
                }}
                placeholder="Tags, comma separated"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
              />
              <button
                onClick={applyTagsFilter}
                className="rounded-lg border border-zinc-600 bg-black px-2 py-2 text-[11px] text-zinc-200"
              >
                Apply
              </button>
            </div>

            <input
              type="date"
              value={searchParams.get("date") || ""}
              onChange={(event) => updateNotesFilters({ date: event.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
            />

            <input
              type="date"
              value={searchParams.get("deadline") || ""}
              onChange={(event) => updateNotesFilters({ deadline: event.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
            />

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={assigneeFilterInput}
                onChange={(event) => setAssigneeFilterInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyAssigneeFilter();
                  }
                }}
                placeholder="Assignee name or email"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
              />
              <button
                onClick={applyAssigneeFilter}
                className="rounded-lg border border-zinc-600 bg-black px-2 py-2 text-[11px] text-zinc-200"
              >
                Apply
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={searchParams.get("sortBy") || "createdAt"}
                onChange={(event) => updateNotesFilters({ sortBy: event.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
              >
                <option value="createdAt">Newest</option>
                <option value="updatedAt">Recently Updated</option>
                <option value="deadline">Deadline</option>
                <option value="title">Title</option>
              </select>

              <select
                value={searchParams.get("sortOrder") || "desc"}
                onChange={(event) => updateNotesFilters({ sortOrder: event.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <button
              onClick={clearSidebarFilters}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              Clear Sidebar Filters
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center p-3 rounded-lg hover:bg-zinc-900 transition-colors ${
                      pathname === item.href
                        ? "bg-white text-black"
                        : "text-zinc-300"
                    }`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <IconComponent size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    {item.href === "/notifications" && unreadCount > 0 && (
                      <span
                        className={`absolute ${
                          isCollapsed ? "top-2 right-2" : "top-2 right-3"
                        } inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium leading-none rounded-full bg-red-600 text-white`}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        {user && !loading && (
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-3 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900 transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isCollapsed ? "Logout" : ""}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>
        )}

      </div>

      {/* Live Transcription Box */}
      {showTranscriptionBox && (isRecording || isGenerating) && (
          <div className="fixed bottom-4 right-4 bg-black border border-zinc-700 p-4 rounded-lg shadow-lg max-w-md z-50 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-white flex items-center">
                <Bot size={16} className="mr-2 text-white" />
                AI Voice Notes
              </h3>
              {!isGenerating && (
                <button
                  onClick={() => setShowTranscriptionBox(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {isRecording && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs text-zinc-200 font-medium">Recording...</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 min-h-[60px] max-h-[120px] overflow-y-auto">
                    <p className="text-sm text-zinc-200">
                      {transcribedText || "Speak naturally to create notes..."}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    The AI will automatically generate notes when you stop recording.
                  </p>
                </>
              )}
              {isGenerating && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-zinc-200 font-medium">Generating notes...</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 min-h-[60px] max-h-[120px] overflow-y-auto">
                    <p className="text-sm text-zinc-200">
                      &ldquo;{transcribedText}&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    AI is analyzing your speech and creating structured notes...
                  </p>
                </>
              )}
            </div>
          </div>
        )}

    </>
  );
}
