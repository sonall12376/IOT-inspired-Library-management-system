package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.Floor;
import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.security.CustomUserDetails;
import com.library.smartlibrary.services.AuditLogService;
import com.library.smartlibrary.services.FloorService;
import com.library.smartlibrary.services.SeatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/floors")
public class FloorController {

    @Autowired
    private FloorService floorService;

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

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Floor> floors = floorService.getAllFloors();
        return ResponseEntity.ok(Map.of("success", true, "floors", floors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return floorService.getFloorById(id)
                .<ResponseEntity<?>>map(floor -> ResponseEntity.ok(Map.of("success", true, "floor", floor)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("success", false, "message", "Floor level not found")));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<?> getSeatsByFloor(@PathVariable String id) {
        List<Seat> seats = seatService.getSeatsByFloor(id);
        return ResponseEntity.ok(Map.of("success", true, "seats", seats));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Floor floor) {
        try {
            Floor created = floorService.createFloor(floor);
            
            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "FLOOR_CREATE",
                    "Created floor level: " + created.getName() + " (Floor #" + created.getFloorNumber() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.status(201).body(Map.of("success", true, "floor", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Floor update) {
        try {
            Floor updated = floorService.updateFloor(id, update);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "FLOOR_UPDATE",
                    "Updated floor configuration: " + updated.getName() + " (Floor #" + updated.getFloorNumber() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "floor", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            Floor floor = floorService.getFloorById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Floor level not found"));

            floorService.deleteFloor(id);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "FLOOR_DELETE",
                    "Deleted floor level: " + floor.getName() + " (Floor #" + floor.getFloorNumber() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "message", "Floor level and associated seats purged successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
