package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.Device;
import com.library.smartlibrary.security.CustomUserDetails;
import com.library.smartlibrary.services.AuditLogService;
import com.library.smartlibrary.services.DeviceService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

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
        List<Device> list = deviceService.getAllDevices();
        return ResponseEntity.ok(Map.of("success", true, "devices", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return deviceService.getDeviceById(id)
                .<ResponseEntity<?>>map(device -> ResponseEntity.ok(Map.of("success", true, "device", device)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("success", false, "message", "Device not found")));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Device device) {
        try {
            if (device.getMacAddress() == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "MAC address is required"));
            }
            Device created = deviceService.createDevice(device);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "DEVICE_REGISTER",
                    "Manually registered IoT device: " + created.getDeviceName() + " (" + created.getMacAddress() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.status(201).body(Map.of("success", true, "device", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Device update) {
        try {
            Device updated = deviceService.updateDevice(id, update);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "DEVICE_UPDATE",
                    "Updated IoT device configuration: " + updated.getDeviceName() + " (" + updated.getMacAddress() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "device", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            Device device = deviceService.getDeviceById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Device node not found"));

            deviceService.deleteDevice(id);

            // Audit Log
            auditLogService.logAction(
                    getCurrentUserId(),
                    "DEVICE_DELETE",
                    "Deleted IoT device node: " + device.getDeviceName() + " (" + device.getMacAddress() + ")",
                    request.getRemoteAddr()
            );

            return ResponseEntity.ok(Map.of("success", true, "message", "Device deleted and unbound successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
