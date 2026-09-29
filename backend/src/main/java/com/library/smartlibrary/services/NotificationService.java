package com.library.smartlibrary.services;

import com.library.smartlibrary.config.WebSocketRoomHandler;
import com.library.smartlibrary.models.Notification;
import com.library.smartlibrary.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@SuppressWarnings("null")
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private WebSocketRoomHandler webSocketRoomHandler;

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification sendNotification(String userId, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setCreatedAt(new Date());
        notification.setRead(false);

        notification = notificationRepository.save(notification);

        // Map payload for WebSocket emission matching Node.js structure
        Map<String, Object> wsPayload = new HashMap<>();
        wsPayload.put("_id", notification.getId());
        wsPayload.put("title", notification.getTitle());
        wsPayload.put("message", notification.getMessage());
        wsPayload.put("type", notification.getType());
        wsPayload.put("isRead", notification.isRead());
        wsPayload.put("createdAt", notification.getCreatedAt());

        webSocketRoomHandler.sendToUser(userId, "notification_received", wsPayload);

        return notification;
    }

    public Notification markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied to notification");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : unread) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }
    }
}
