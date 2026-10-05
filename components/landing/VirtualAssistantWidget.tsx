"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  PhoneCall,
  Calendar,
  AlertTriangle,
  HeartPulse
} from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; url?: string; query?: string }[];
  feedback?: 'like' | 'dislike' | null;
}

const INITIAL_SUGGESTIONS = [
  'Bagaimana cara daftar antrean online dari rumah?',
  'Kapan jadwal operasional poli di Puskesmas?',
  'Apa syarat berobat menggunakan kartu BPJS?',
  'Di mana kontak gawat darurat dan lokasi IGD 24 Jam?'
];

export default function VirtualAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Halo! Saya **Siti**, Asisten Virtual SIKDA Kabupaten Bogor. Ada yang bisa saya bantu terkait jadwal dokter, cara daftar online, atau informasi layanan puskesmas hari ini?',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Daftar Online dari Rumah', url: '/booking' },
        { label: 'Jadwal Dokter & Poli', url: '/#doctor-schedule' },
        { label: 'Hubungi Call Center 119', url: 'tel:119' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const historyPayload = messages.slice(-5).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch(`${apiUrl}/virtual-assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi server asisten virtual');
      }

      const json = await res.json();
      const replyData = json.data || {};

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: replyData.reply || 'Mohon maaf, silakan ulangi kembali pertanyaan Anda.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: replyData.suggestedActions || []
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Virtual Assistant fallback invoked:', err);
      // Fallback response offline jika backend sedang restart/gagal
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        sender: 'assistant',
        text: 'Untuk pendaftaran antrean faskes dari rumah, silakan kunjungi menu **Daftar Online** menggunakan nomor WhatsApp aktif Anda. Tiket dan nomor urut akan langsung dikirim ke WhatsApp Anda tanpa perlu antre di loket.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'Buka Pendaftaran Online', url: '/booking' },
          { label: 'Info Gawat Darurat 119', url: 'tel:119' }
        ]
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m))
    );
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'assistant',
        text: 'Obrolan telah diperbarui. Halo! Saya **Siti**, Asisten Virtual SIKDA. Silakan ajukan pertanyaan seputar layanan kesehatan, jadwal poliklinik, atau pendaftaran mandiri.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'Daftar Online dari Rumah', url: '/booking' },
          { label: 'Jadwal Dokter & Poli', url: '/#doctor-schedule' }
        ]
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      {/* ─── EXPANDED CHAT WINDOW (CLEVELAND CLINIC VIRTUAL ASSISTANT STYLE) ─── */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md border-2 border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm tracking-tight text-white leading-tight">
                    Siti — Asisten Virtual SIKDA
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                    AI 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Siap Melayani Informasi Faskes & Pasien
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Mulai Ulang Percakapan"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup Obrolan"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 text-slate-800 text-xs">
            {/* Quick Helper Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-800 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Asisten Virtual Kesehatan Resmi</span>
                <p className="text-emerald-700 mt-0.5 leading-relaxed">
                  Tanyakan info jadwal dokter, alur pendaftaran antrean via WhatsApp, atau faskes terdekat di Kabupaten Bogor.
                </p>
              </div>
            </div>

            {/* Chat Thread */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`flex items-start gap-2.5 max-w-[88%] ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line text-xs font-medium">
                      {msg.text}
                    </div>

                    {/* Suggested Actions within Message */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, idx) =>
                          action.url ? (
                            <Link
                              key={idx}
                              href={action.url}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 transition-colors"
                            >
                              <span>{action.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(action.query || action.label)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer text-left"
                            >
                              {action.label}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp & Feedback for Assistant */}
                <div
                  className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'like')}
                        className={`p-1 hover:text-emerald-600 transition-colors ${
                          msg.feedback === 'like' ? 'text-emerald-600 font-bold' : ''
                        }`}
                        title="Jawaban Membantu"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'dislike')}
                        className={`p-1 hover:text-rose-600 transition-colors ${
                          msg.feedback === 'dislike' ? 'text-rose-600 font-bold' : ''
                        }`}
                        title="Jawaban Kurang Sesuai"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Typing indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-500 flex items-center gap-2">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Siti sedang menyusun jawaban...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Suggestions */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
              Topik Populer:
            </span>
            {INITIAL_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(suggestion)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-full shrink-0 transition-colors cursor-pointer border border-slate-200"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ketik pertanyaan seputar layanan kesehatan..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm shadow-emerald-600/20"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Disclaimer Footer */}
          <div className="bg-slate-100 px-3 py-1.5 text-center text-[9px] text-slate-500 font-medium border-t border-slate-200/60">
            Bukan pengganti diagnosis dokter. Untuk gawat darurat, hubungi <span className="font-bold text-rose-600">119</span> atau IGD terdekat.
          </div>
        </div>
      )}

      {/* ─── FLOATING LAUNCHER BUTTON (WITH BREATHING GLOW & TOOLTIP) ─── */}
      <div className="relative group">
        {!isOpen && (
          <div className="absolute right-0 -top-12 bg-slate-950 text-white px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight shadow-xl border border-slate-800 flex items-center gap-1.5 whitespace-nowrap pointer-events-none group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin [animation-duration:3s]" />
            <span>Tanya Asisten AI SIKDA</span>
            <div className="w-2 h-2 bg-slate-950 rotate-45 absolute -bottom-1 right-6 border-r border-b border-slate-800"></div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer relative group-hover:scale-105 ${
            isOpen
              ? 'bg-slate-900 text-white rotate-90 shadow-slate-900/30'
              : 'bg-gradient-to-tr from-emerald-700 via-teal-600 to-emerald-500 text-white shadow-emerald-600/40'
          }`}
          aria-label="Buka Asisten Virtual SIKDA"
        >
          {/* Subtle pulse wave */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-40 animate-ping pointer-events-none"></span>
          )}

          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full"></span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
