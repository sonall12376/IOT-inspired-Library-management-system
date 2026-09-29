package com.library.smartlibrary.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketRoomHandler extends TextWebSocketHandler {

    private static final Set<WebSocketSession> allSessions = ConcurrentHashMap.newKeySet();
    private static final Map<String, Set<WebSocketSession>> userRooms = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(@org.springframework.lang.NonNull WebSocketSession session) throws Exception {
        allSessions.add(session);
    }

    @Override
    public void afterConnectionClosed(@org.springframework.lang.NonNull WebSocketSession session, @org.springframework.lang.NonNull CloseStatus status) throws Exception {
        allSessions.remove(session);
        for (Set<WebSocketSession> room : userRooms.values()) {
            room.remove(session);
        }
    }

    @Override
    protected void handleTextMessage(@org.springframework.lang.NonNull WebSocketSession session, @org.springframework.lang.NonNull TextMessage message) throws Exception {
        try {
            Map<String, Object> payload = objectMapper.readValue(
                message.getPayload(), 
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
            );
            String event = (String) payload.get("event");
            Object data = payload.get("data");

            if ("join_user_room".equals(event) && data instanceof String) {
                String userId = (String) data;
                userRooms.computeIfAbsent("user_" + userId, k -> ConcurrentHashMap.newKeySet()).add(session);
            }
        } catch (Exception e) {
            // Ignore malformed text messages
        }
    }

    public void sendToUser(String userId, String event, Object data) {
        Set<WebSocketSession> sessions = userRooms.get("user_" + userId);
        if (sessions != null) {
            String payload = serialize(event, data);
            if (payload != null) {
                TextMessage textMessage = new TextMessage(payload);
                sessions.forEach(session -> {
                    if (session.isOpen()) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (IOException e) {
                            // Suppress write errors
                        }
                    }
                });
            }
        }
    }

    public void broadcast(String event, Object data) {
        String payload = serialize(event, data);
        if (payload != null) {
            TextMessage textMessage = new TextMessage(payload);
            allSessions.forEach(session -> {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        // Suppress write errors
                    }
                }
            });
        }
    }

    private String serialize(String event, Object data) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("event", event);
            message.put("data", data);
            return objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            return null;
        }
    }
}
