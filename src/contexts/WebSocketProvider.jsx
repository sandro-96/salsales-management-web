import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WebSocketContext } from "./WebSocketContext";
import { useAuth } from "../hooks/useAuth.js";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

/**
 * Cung cấp STOMP client duy nhất cho toàn app.
 *
 * - Gửi `Authorization: Bearer <token>` trong STOMP CONNECT frame để backend
 *   `StompAuthChannelInterceptor` xác thực JWT.
 * - Tự reconnect khi `user.id` đổi (login/logout) để đảm bảo dùng token mới.
 * - Các subscribe gọi khi chưa connected sẽ được retry: caller chỉ cần gọi
 *   lại `subscribe(dest, cb)` sau khi `connected=true`; các hook như
 *   `useBranchChannel` tự làm điều này qua deps.
 */
const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const stompClientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const messageQueue = useRef([]);
  const userIdRef = useRef(null);

  const getToken = useCallback(() => {
    try {
      return localStorage.getItem("accessToken") || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    const currentUserId = user?.id || null;
    userIdRef.current = currentUserId;

    const token = getToken();
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 3000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        setConnected(true);
        console.log("✅ STOMP connected");
        messageQueue.current.forEach((msg) => {
          client.publish(msg);
        });
        messageQueue.current = [];
      },
      onDisconnect: () => {
        setConnected(false);
        console.warn("❌ STOMP disconnected");
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame.headers?.message || frame);
      },
    });

    client.onWebSocketClose = () => {
      setConnected(false);
      console.warn("🔄 STOMP socket closed, reconnecting...");
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch (err) {
        console.warn("STOMP deactivate error", err);
      }
      setConnected(false);
      stompClientRef.current = null;
    };
  }, [user?.id, getToken]);

  const subscribe = useCallback((destination, callback) => {
    const client = stompClientRef.current;
    if (client && client.connected) {
      const subscription = client.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (err) {
          console.error("STOMP parse error", destination, err);
        }
      });
      return () => {
        try {
          subscription.unsubscribe();
        } catch (err) {
          console.warn("STOMP unsubscribe error", err);
        }
      };
    }
    console.warn("STOMP chưa kết nối. Không thể subscribe:", destination);
    return () => {};
  }, []);

  const send = useCallback((destination, payload) => {
    const message = { destination, body: JSON.stringify(payload) };
    const client = stompClientRef.current;
    if (client && client.connected) {
      client.publish(message);
    } else {
      if (messageQueue.current.length > 100) {
        messageQueue.current.shift();
      }
      messageQueue.current.push(message);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ subscribe, send, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
