package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.Notification;
import com.library.smartlibrary.security.CustomUserDetails;
import com.library.smartlibrary.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    private String getCurrentUserId() {
        try {
            CustomUserDetails details = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return details.getId();
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Notification> list = notificationService.getUserNotifications(getCurrentUserId());
        return ResponseEntity.ok(Map.of("success", true, "notifications", list));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> read(@PathVariable String id) {
        try {
            Notification notification = notificationService.markAsRead(id, getCurrentUserId());
            return ResponseEntity.ok(Map.of("success", true, "notification", notification));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> readAll() {
        notificationService.markAllAsRead(getCurrentUserId());
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }
}
