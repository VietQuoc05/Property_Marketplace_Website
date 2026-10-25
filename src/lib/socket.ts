import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    // Server-side guard
    return null as unknown as Socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('accessToken');

  if (!socket) {
    socket = io(apiUrl, {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
    });
  } else {
    // If token changed, update auth.token
    if (socket.auth && typeof socket.auth === 'object') {
      (socket.auth as { token: string }).token = token || '';
    }
    if (!socket.connected && token) {
      socket.connect();
    }
  }

  return socket;
};

export const updateSocketAuth = (token: string | null) => {
  if (socket) {
    socket.auth = { token: token || '' };
    if (socket.connected) {
      socket.disconnect().connect();
    } else {
      socket.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
