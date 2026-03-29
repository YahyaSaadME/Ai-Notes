"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Users,
  User,
  LogOut,
  NotebookPen,
  BotOff,
  Bot,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface User {
  email: string;
  name: string;
  role: "admin" | "user";
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const finalTranscriptsRef = useRef<string[]>([]);
  const [showTranscriptionBox, setShowTranscriptionBox] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

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
      setInterimTranscript("");
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

    if (user?.role === "admin") {
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

  return (
    <>
      <div
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-gray-200 transition-all duration-300 shadow-sm fixed h-screen flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">AI Notes</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
          
        </div>

        {/* User Info */}

{user && !loading && (
          <div className="p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex justify-between items-start">
                <div className="text-sm">
                  <p className="font-medium text-gray-800 truncate">
                    {user.name}
                  </p>
                  <p className="text-gray-500 truncate">{user.email}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors ${
                    isRecording ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    user.role === "admin" ? "bg-red-500" : "bg-blue-500"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center w-full mt-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
                    isRecording ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "AI Assistant" : ""}
                >
                  {isRecording ? <BotOff size={20}/> : <Bot size={20} />}
                </button>
              </div>
            )}
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
                    className={`relative flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
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
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors ${
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
          <div className="fixed bottom-4 right-4 bg-white border border-gray-300 p-4 rounded-lg shadow-lg max-w-md z-50 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Bot size={16} className="mr-2 text-blue-600" />
                AI Voice Notes
              </h3>
              {!isGenerating && (
                <button
                  onClick={() => setShowTranscriptionBox(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {isRecording && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-600 font-medium">Recording...</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[60px] max-h-[120px] overflow-y-auto">
                    <p className="text-sm text-gray-700">
                      {transcribedText || "Speak naturally to create notes..."}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    The AI will automatically generate notes when you stop recording.
                  </p>
                </>
              )}
              {isGenerating && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-blue-600 font-medium">Generating notes...</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 min-h-[60px] max-h-[120px] overflow-y-auto">
                    <p className="text-sm text-gray-700">
                      &ldquo;{transcribedText}&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-blue-500">
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
