import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (onNewComplaint, onUpdateComplaint, onFeedEvent) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected:', socket.id);
    });

    if (onNewComplaint) {
      socket.on('map:complaint:new', onNewComplaint);
    }
    if (onUpdateComplaint) {
      socket.on('map:complaint:updated', onUpdateComplaint);
      socket.on('complaint:update', onUpdateComplaint);
    }
    if (onFeedEvent) {
      socket.on('feed:event', onFeedEvent);
    }

    return () => {
      socket.disconnect();
    };
  }, [onNewComplaint, onUpdateComplaint, onFeedEvent]);

  const joinComplaintRoom = (id) => {
    if (socketRef.current) {
      socketRef.current.emit('complaint:join', id);
    }
  };

  const leaveComplaintRoom = (id) => {
    if (socketRef.current) {
      socketRef.current.emit('complaint:leave', id);
    }
  };

  return {
    socket: socketRef.current,
    joinComplaintRoom,
    leaveComplaintRoom,
  };
};
