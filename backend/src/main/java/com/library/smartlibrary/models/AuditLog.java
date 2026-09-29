package com.library.smartlibrary.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;

    @Indexed
    private String userId; // Reference to User ID

    private String action;

    private String details;

    private String ipAddress;

    private Date timestamp = new Date();

    public AuditLog() {}

    public AuditLog(String userId, String action, String details, String ipAddress) {
        this.userId = userId;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
        this.timestamp = new Date();
    }

    public String getId() {
        return id;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("_id")
    public String get_id() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }
}
