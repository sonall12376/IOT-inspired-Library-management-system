package com.library.smartlibrary.services;

import com.library.smartlibrary.models.AuditLog;
import com.library.smartlibrary.repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public void logAction(String userId, String action, String details, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
        log.setTimestamp(new Date());
        auditLogRepository.save(log);
    }
}
