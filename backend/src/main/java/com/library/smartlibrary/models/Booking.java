package com.library.smartlibrary.models;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;

    @Indexed
    private String studentId; // Reference to User ID

    @Indexed
    private String seatId; // Reference to Seat ID

    private Date startTime;

    private Date endTime;

    private String status = "pending"; // pending, active, completed, cancelled, no-show

    private Date checkInTime;

    private Date checkOutTime;

    private Date absenceStartedAt;

    private boolean absenceWarningSent = false;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    public Booking() {}

    public Booking(String studentId, String seatId, Date startTime, Date endTime) {
        this.studentId = studentId;
        this.seatId = seatId;
        this.startTime = startTime;
        this.endTime = endTime;
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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getSeatId() {
        return seatId;
    }

    public void setSeatId(String seatId) {
        this.seatId = seatId;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(Date checkInTime) {
        this.checkInTime = checkInTime;
    }

    public Date getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(Date checkOutTime) {
        this.checkOutTime = checkOutTime;
    }

    public Date getAbsenceStartedAt() {
        return absenceStartedAt;
    }

    public void setAbsenceStartedAt(Date absenceStartedAt) {
        this.absenceStartedAt = absenceStartedAt;
    }

    public boolean isAbsenceWarningSent() {
        return absenceWarningSent;
    }

    public void setAbsenceWarningSent(boolean absenceWarningSent) {
        this.absenceWarningSent = absenceWarningSent;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
