import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WebSocketContext } from "./WebSocketContext";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

const WebSocketProvider = ({ children }) => {
    const stompClientRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const messageQueue = useRef([]); // 🧠 HÀNG ĐỢI GỬI TIN NHẮN

    useEffect(() => {
        const socket = new SockJS(WS_URL);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 3000,
            onConnect: () => {
                setConnected(true);
                console.log("✅ STOMP connected");

                // ✅ Gửi các tin nhắn trong hàng đợi
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
                console.error("STOMP error", frame);
            },
        });

        client.onWebSocketClose = () => {
            console.warn("🔄 STOMP socket closed, reconnecting...");
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    const subscribe = (destination, callback) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            const subscription = stompClientRef.current.subscribe(destination, (message) => {
                console.log(`📬 Nhận tin nhắn từ ${destination}:`, message);
                const body = JSON.parse(message.body);
                callback(body);
            });

            // ✅ Trả về hàm hủy đăng ký
            return () => subscription.unsubscribe();
        } else {
            console.warn("STOMP chưa kết nối. Không thể subscribe.");
            return () => {}; // Tránh lỗi nếu gọi unsub() sau này
        }
    };

    const send = (destination, payload) => {
        const message = { destination, body: JSON.stringify(payload) };

        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish(message);
        } else {
            console.warn("⏳ STOMP chưa kết nối, đưa vào hàng đợi:", message);
            if (messageQueue.current.length > 100) {
                messageQueue.current.shift(); // bỏ tin cũ
            }
            messageQueue.current.push(message);
        }
    };

    return (
        <WebSocketContext.Provider value={{ subscribe, send, connected }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketProvider;
