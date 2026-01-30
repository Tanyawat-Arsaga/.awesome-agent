import { useState, useEffect, useRef, useCallback } from 'react';
import { useRalphStore } from '../store/useRalphStore';
import { type RalphStatus } from '../store/useRalphStore'; // Import RalphStatus type

export function useRalphWS() {
  const [connected, setWsConnected] = useState(false);
  const { setStatus, appendLogs, setTasks, setChangedFiles } = useRalphStore(); // Added setChangedFiles

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      socket = new WebSocket(`${protocol}//${host}/ws`);

      socket.onopen = () => {
        setWsConnected(true);
        console.log('📡 Ralph WS: Connected');
        // Request initial state and logs on open
        // Backend should broadcast initial logs and status upon connection
        // This client might not need to fetch them manually here, but can rely on broadcast
        socket.send(JSON.stringify({ type: 'initial_state' })); 
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status') {
            setStatus(msg.data);
          } else if (msg.type === 'logs') {
            appendLogs(msg.data);
          } else if (msg.type === 'tasks') {
            setTasks(msg.data);
          } else if (msg.type === 'files') { // Handle files update
            setChangedFiles(msg.data);
          }
        } catch (e) {
          console.error('📡 Ralph WS: Error parsing message', e);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        console.warn('📡 Ralph WS: Disconnected, retrying...');
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      socket?.close();
      clearTimeout(reconnectTimer);
    };
  }, [setStatus, appendLogs, setTasks, setChangedFiles]); // Dependencies: re-run if store actions change

  return { connected };
}
