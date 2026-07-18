'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { apiRequest } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import ToastContainer from '@/components/ToastContainer';

interface RoomMember {
  userId: string;
  user: { id: string; name: string; avatarUrl?: string; isOnline: boolean };
}

interface Room {
  id: string;
  name: string | null;
  isGroup: boolean;
  members: RoomMember[];
  messages: { content: string; createdAt: string }[];
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  chatRoomId: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl?: string };
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export default function ChatPage() {
  const { user, token, loading, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const activeRoomRef = useRef<Room | null>(null);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    if (!loading && !token) router.push('/login');
  }, [loading, token, router]);

  useEffect(() => {
    if (!token) return;
    apiRequest('/rooms', {}, token).then(setRooms).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!socket || rooms.length === 0) return;
    rooms.forEach((room) => {
      socket.emit('room:join', { chatRoomId: room.id });
    });
  }, [socket, rooms]);

  useEffect(() => {
    if (!activeRoom || !token) return;
    apiRequest(`/rooms/${activeRoom.id}/messages`, {}, token).then(setMessages).catch(console.error);
  }, [activeRoom, token]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg: Message) => {
      const current = activeRoomRef.current;

      if (current && msg.chatRoomId === current.id) {
        setMessages((prev) => [...prev, msg]);
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.id === msg.chatRoomId
            ? { ...r, messages: [{ content: msg.content, createdAt: msg.createdAt }] }
            : r,
        ),
      );

      if (msg.senderId !== user?.id && (!current || msg.chatRoomId !== current.id)) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.chatRoomId]: (prev[msg.chatRoomId] || 0) + 1,
        }));
      }
    };

    const onTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('message:new', onMessage);
    socket.on('typing:update', onTyping);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing:update', onTyping);
    };
  }, [socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced live user search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!searchQuery.trim() || !token) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await apiRequest(
          `/users/search?q=${encodeURIComponent(searchQuery.trim())}`,
          {},
          token,
        );
        setSearchResults(results);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, token]);

  const handleSend = () => {
    if (!input.trim() || !socket || !activeRoom) return;
    socket.emit('message:send', { chatRoomId: activeRoom.id, content: input.trim() });
    setInput('');
    socket.emit('typing:stop', { chatRoomId: activeRoom.id });
  };

  const handleTyping = (value: string) => {
    setInput(value);
    if (!socket || !activeRoom) return;

    socket.emit('typing:start', { chatRoomId: activeRoom.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { chatRoomId: activeRoom.id });
    }, 1500);
  };

  const startDirectChat = async (otherUserId: string) => {
    if (!token) return;
    try {
      const room = await apiRequest(
        '/rooms/direct',
        { method: 'POST', body: JSON.stringify({ otherUserId }) },
        token,
      );
      setRooms((prev) => {
        const exists = prev.find((r) => r.id === room.id);
        return exists ? prev : [{ ...room, messages: room.messages || [] }, ...prev];
      });
      setActiveRoom({ ...room, messages: room.messages || [] });
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openRoom = (room: Room) => {
    setActiveRoom(room);
    setUnreadCounts((prev) => ({ ...prev,  [room.id]: 0 }));
  };

  const openRoomById = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) openRoom(room);
  };

  const closeRoom = () => setActiveRoom(null);

  const getRoomLabel = (room: Room) => {
    if (room.isGroup) return room.name || 'Group chat';
    const other = room.members.find((m) => m.userId !== user?.id);
    return other?.user?.name || 'Direct chat';
  };

  const isOtherOnline = (room: Room) => {
    if (room.isGroup) return false;
    const other = room.members.find((m) => m.userId !== user?.id);
    return other ? onlineUsers.has(other.userId) : false;
  };

  if (loading || !token) return null;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <ToastContainer />

      {/* Sidebar — full width on mobile when no room is open, fixed width on desktop always */}
      <div
        className={`w-full md:w-72 border-r border-gray-200 bg-white flex-col ${
          activeRoom ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell onOpenChat={openRoomById} />
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-600 ml-2">
              Logout
            </button>
          </div>
        </div>

        {/* Username/email search */}
        <div className="p-3 border-b border-gray-200 relative">
          <p className="text-xs font-medium text-gray-500 mb-2">Find someone to chat with</p>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {searchQuery.trim() && (
            <div className="mt-2 border border-gray-200 rounded-md max-h-56 overflow-y-auto bg-white">
              {searching ? (
                <p className="text-xs text-gray-400 text-center py-3">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No users found</p>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startDirectChat(u.id)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-center gap-2 border-b border-gray-50 last:border-b-0"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        u.isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => openRoom(room)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                activeRoom?.id === room.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!room.isGroup && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isOtherOnline(room) ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                  <p className="font-medium text-sm text-gray-900 truncate">{getRoomLabel(room)}</p>
                </div>
                {unreadCounts[room.id] > 0 && (
                  <span className="bg-green-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                    {unreadCounts[room.id]}
                  </span>
                )}
              </div>
              {room.messages?.[0] && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{room.messages[0].content}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area — full width on mobile when a room is open, flex-1 on desktop always */}
      <div className={`flex-1 flex-col min-w-0 ${activeRoom ? 'flex' : 'hidden md:flex'}`}>
        {activeRoom ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-2">
              <button
                onClick={closeRoom}
                className="md:hidden mr-1 text-gray-500 hover:text-gray-700 shrink-0"
                aria-label="Back to chats"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="font-medium text-gray-900 truncate">{getRoomLabel(activeRoom)}</p>
              {isOtherOnline(activeRoom) && (
                <span className="text-xs text-green-600 shrink-0">● online</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs px-4 py-2 rounded-2xl text-sm wrap-break-word ${
                      msg.senderId === user?.id
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.senderId !== user?.id && (
                      <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender.name}</p>
                    )}
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {typingUsers.size > 0 && (
                <p className="text-xs text-gray-400 italic">Someone is typing...</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex gap-2">
              <input
                value={input}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shrink-0"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-gray-400">
            Select a chat or start a new one
          </div>
        )}
      </div>
    </div>
  );
}