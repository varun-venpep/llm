'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, Bot, User, Minimize2, Loader2, Maximize2 } from 'lucide-react';

export default function ChatWidget() {
    const pathname = usePathname();
    const [session, setSession] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated && data.user) {
                    setSession(data);
                    setRole(data.user.role);
                }
            })
            .catch(() => {});
    }, []);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'ai'|'user', content: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dynamic Welcome Message based on exactly what context the router reads
    useEffect(() => {
        if (messages.length === 0 && role) {
            let msg = 'Hello! How can I help you today?';
            if (role === 'SUPER_ADMIN') {
                msg = 'Hello Super Admin! I have synced with global platform metrics and revenue records. What would you like to analyze?';
            } else if (role === 'TENANT_ADMIN') {
                msg = 'Hi Admin! I have loaded your workspace’s learner progress and enrollment data. How can I assist you?';
            } else if (role === 'LEARNER') {
                msg = 'Hello! I am your AI Knowledge Base. Ask me a question about your courses and I will help you learn!';
            }
            setMessages([{ role: 'ai', content: msg }]);
        }
    }, [role, messages.length]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Don't render widget on login pages or if not authenticated (wait for session fetch)
    if (!session?.user || pathname?.includes('/login')) return null;

    // Detect if learner is on a lesson page to provide local context to the proprietary endpoint
    const lessonMatch = pathname.match(/\/lesson\/([a-zA-Z0-9_-]+)/);
    const activeLessonId = lessonMatch ? lessonMatch[1] : null;

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    lessonId: activeLessonId
                })
            });

            const data = await res.json();
            
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: data.error || 'Connection failed.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Offline engine unavailable.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans flex flex-col items-end pointer-events-none">
            
            {/* Chat Window */}
            {isOpen && (
                <div 
                    className={`glassmorphism mb-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col pointer-events-auto overflow-hidden transition-all duration-300 origin-bottom-right ${isExpanded ? 'w-[400px] h-[600px] md:w-[600px] md:h-[700px]' : 'w-[320px] h-[450px] sm:w-[380px] sm:h-[550px]'}`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">Proprietary AI</h3>
                                <p className="text-[10px] text-white/70 uppercase tracking-widest leading-tight">Secure Context Active</p>
                            </div>
                        </div>
                        <div className="flex gap-2 text-white/70">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-white transition-colors">
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end ml-auto flex-row-reverse' : 'self-start'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-secondary/80 border border-white/5' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                                    {m.role === 'user' ? <User className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4 text-blue-400" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-secondary text-foreground rounded-tr-sm' : 'bg-blue-500/10 text-blue-100 border border-blue-500/20 rounded-tl-sm'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3 max-w-[85%] self-start">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="p-4 rounded-2xl text-sm bg-blue-500/5 border border-blue-500/10 rounded-tl-sm flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background/80 border-t border-white/5 shrink-0">
                        <form onSubmit={sendMessage} className="relative flex items-center">
                            <input 
                                type="text"
                                className="w-full bg-secondary/50 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder={activeLessonId ? "Ask about this lesson transcript..." : "Ask me anything..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || loading}
                                className="absolute right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white disabled:opacity-50 transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                            </button>
                        </form>
                        <div className="text-center mt-2 flex justify-between items-center px-1">
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                                Proprietary Enterprise LLM
                            </span>
                            <span className="text-[9px] font-medium text-blue-400/50 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 animate-pulse" /> Active
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'w-12 h-12 rounded-full bg-secondary border border-white/10 text-muted-foreground' : 'w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/25'}`}
            >
                {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
}
