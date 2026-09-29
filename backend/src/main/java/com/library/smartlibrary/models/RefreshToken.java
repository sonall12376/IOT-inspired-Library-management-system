package com.library.smartlibrary.models;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "refresh_tokens")
public class RefreshToken {
    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed
    private String userId; // Reference to User ID

    private Date expiresAt;

    @CreatedDate
    private Date createdAt;

    public RefreshToken() {}

    public RefreshToken(String token, String userId, Date expiresAt) {
        this.token = token;
        this.userId = userId;
        this.expiresAt = expiresAt;
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

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
