package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.security.CustomUserDetails;
import com.library.smartlibrary.services.AuditLogService;
import com.library.smartlibrary.services.SeatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seats")
public class SeatController {

    @Autowired
    private SeatService seatService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private HttpServletRequest request;

    private String getCurrentUserId() {
        try {
            CustomUserDetails details = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return details.getId();
        } catch (Exception e) {
            return null;
        }
    }

    public static class OverrideRequest {
        public String status;
        public String reason;
    }

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<?> getByFloor(@PathVariable String floorId) {
        List<Seat> seats = seatService.getSeatsByFloor(floorId);
        return ResponseEntity.ok(Map.of("success", true, "seats", seats));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Seat seat) {
        try {
            Seat created = seatService.createSeat(seat);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "SEAT_CREATE",
                    "Created seat node: " + created.getSeatNumber() + " (Room: " + created.getRoomName() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.status(201).body(Map.of("success", true, "seat", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Seat update) {
        try {
            Seat updated = seatService.updateSeat(id, update);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "SEAT_UPDATE",
                    "Updated seat configuration: " + updated.getSeatNumber() + " (Room: " + updated.getRoomName() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "seat", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            Seat seat = seatService.getSeatById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Seat node not found"));

            seatService.deleteSeat(id);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "SEAT_DELETE",
                    "Deleted seat node: " + seat.getSeatNumber() + " (Room: " + seat.getRoomName() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "message", "Seat deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/override")
    public ResponseEntity<?> override(@PathVariable String id, @RequestBody OverrideRequest req) {
        try {
            if (req.status == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Status parameter required"));
            }

            Seat seat = seatService.getSeatById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Seat node not found"));

            seat.setStatus(req.status);
            Seat updated = seatService.updateSeat(seat.getId(), seat);

            // Audit Log
            String reasonText = req.reason != null ? " Reason: " + req.reason : "";
            auditLogService.logAction(
                    getCurrentUserId(),
                    "SEAT_OVERRIDE",
                    "Status overridden manually on " + updated.getSeatNumber() + " to " + updated.getStatus() + "." + reasonText,
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "seat", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleSeatStatus(@PathVariable String id) {
        try {
            Seat seat = seatService.getSeatById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Seat node not found"));

            String currentStatus = seat.getStatus();
            String newStatus = "occupied".equals(currentStatus) ? "vacant" : "occupied";
            seat.setStatus(newStatus);
            
            Seat updated = seatService.updateSeat(seat.getId(), seat);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "SEAT_TOGGLE",
                    "Status toggled on seat " + updated.getSeatNumber() + " to " + updated.getStatus(),
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "seat", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/sensor-event")
    public ResponseEntity<?> handleSensorEvent(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        try {
            Seat seat = seatService.getSeatById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Seat node not found"));

            String sensorType = (String) payload.getOrDefault("sensorType", "pressure");
            Boolean active = (Boolean) payload.getOrDefault("active", false);

            if ("pressure".equals(sensorType)) {
                if (Boolean.TRUE.equals(active)) {
                    seat.setStatus("occupied");
                    seat.setLastActivityTime(new java.util.Date());
                } else {
                    seat.setStatus("vacant");
                    seat.setLastActivityTime(null);
                }
            } else if ("motion".equals(sensorType)) {
                if (Boolean.TRUE.equals(active)) {
                    seat.setStatus("occupied");
                    seat.setLastActivityTime(new java.util.Date());
                }
            }

            Seat updated = seatService.updateSeat(seat.getId(), seat);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "SENSOR_EVENT",
                    "Sensor event received on seat " + updated.getSeatNumber() + " (" + sensorType + " active=" + active + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "seat", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
