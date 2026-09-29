package com.library.smartlibrary.models;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "seats")
@CompoundIndex(name = "seat_floor_unique", def = "{'seatNumber': 1, 'floorId': 1}", unique = true)
public class Seat {
    @Id
    private String id;

    private String seatNumber;

    @Indexed
    private String floorId; // Reference to Floor ID

    private String roomName;

    private String seatType = "desk";

    private boolean hasPowerOutlet = false;

    private boolean isNearWindow = false;

    private Coordinates coordinates;

    private String status = "vacant";

    @Indexed
    private String deviceId; // Reference to Device ID (optional)

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    private Date lastActivityTime;

    public static class Coordinates {
        private Integer x;
        private Integer y;

        public Coordinates() {}

        public Coordinates(Integer x, Integer y) {
            this.x = x;
            this.y = y;
        }

        public Integer getX() {
            return x;
        }

        public void setX(Integer x) {
            this.x = x;
        }

        public Integer getY() {
            return y;
        }

        public void setY(Integer y) {
            this.y = y;
        }
    }

    public Seat() {}

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

    public String getSeatNumber() {
        return seatNumber;
    }

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }

    public String getFloorId() {
        return floorId;
    }

    public void setFloorId(String floorId) {
        this.floorId = floorId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getSeatType() {
        return seatType;
    }

    public void setSeatType(String seatType) {
        this.seatType = seatType;
    }

    public boolean isHasPowerOutlet() {
        return hasPowerOutlet;
    }

    public void setHasPowerOutlet(boolean hasPowerOutlet) {
        this.hasPowerOutlet = hasPowerOutlet;
    }

    public boolean isIsNearWindow() {
        return isNearWindow;
    }

    public void setIsNearWindow(boolean isNearWindow) {
        this.isNearWindow = isNearWindow;
    }

    public Coordinates getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(Coordinates coordinates) {
        this.coordinates = coordinates;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
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

    public Date getLastActivityTime() {
        return lastActivityTime;
    }

    public void setLastActivityTime(Date lastActivityTime) {
        this.lastActivityTime = lastActivityTime;
    }
}
