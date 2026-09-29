package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.AuditLog;
import com.library.smartlibrary.services.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<AuditLog> list = auditLogService.getAllLogs();
        return ResponseEntity.ok(Map.of("success", true, "logs", list));
    }
}
