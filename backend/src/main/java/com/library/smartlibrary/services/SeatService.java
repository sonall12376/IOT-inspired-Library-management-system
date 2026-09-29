package com.library.smartlibrary.services;

import com.library.smartlibrary.config.WebSocketRoomHandler;
import com.library.smartlibrary.models.Floor;
import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.repositories.FloorRepository;
import com.library.smartlibrary.repositories.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class SeatService {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private WebSocketRoomHandler webSocketRoomHandler;

    public List<Seat> getSeatsByFloor(String floorId) {
        return seatRepository.findByFloorId(floorId);
    }

    public Optional<Seat> getSeatById(String id) {
        return seatRepository.findById(id);
    }

    public Seat createSeat(Seat seat) {
        Floor floor = floorRepository.findById(seat.getFloorId())
                .orElseThrow(() -> new IllegalArgumentException("Floor level reference not found"));

        // Boundary Validation
        if (seat.getCoordinates().getX() < 1 || seat.getCoordinates().getX() > floor.getGridDimensions().getColumns() ||
            seat.getCoordinates().getY() < 1 || seat.getCoordinates().getY() > floor.getGridDimensions().getRows()) {
            throw new IllegalArgumentException("Coordinates exceed the defined grid boundaries");
        }

        // Unique validation on floor
        if (seatRepository.findBySeatNumberAndFloorId(seat.getSeatNumber(), seat.getFloorId()).isPresent()) {
            throw new IllegalArgumentException("Seat " + seat.getSeatNumber() + " is already mapped on this floor level");
        }

        return seatRepository.save(seat);
    }

    public Seat updateSeat(String id, Seat update) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seat node not found"));

        if (update.getSeatNumber() != null && !update.getSeatNumber().equals(seat.getSeatNumber())) {
            if (seatRepository.findBySeatNumberAndFloorId(update.getSeatNumber(), seat.getFloorId()).isPresent()) {
                throw new IllegalArgumentException("Seat " + update.getSeatNumber() + " already exists on this floor");
            }
            seat.setSeatNumber(update.getSeatNumber());
        }

        if (update.getRoomName() != null) {
            seat.setRoomName(update.getRoomName());
        }

        if (update.getSeatType() != null) {
            seat.setSeatType(update.getSeatType());
        }

        seat.setHasPowerOutlet(update.isHasPowerOutlet());
        seat.setIsNearWindow(update.isIsNearWindow());

        if (update.getCoordinates() != null) {
            Floor floor = floorRepository.findById(seat.getFloorId()).orElseThrow();
            if (update.getCoordinates().getX() < 1 || update.getCoordinates().getX() > floor.getGridDimensions().getColumns() ||
                update.getCoordinates().getY() < 1 || update.getCoordinates().getY() > floor.getGridDimensions().getRows()) {
                throw new IllegalArgumentException("Coordinates exceed grid boundaries");
            }
            seat.setCoordinates(update.getCoordinates());
        }

        // Handle device mapping updates (optional device ID mapping)
        seat.setDeviceId(update.getDeviceId());

        if (update.getStatus() != null) {
            seat.setStatus(update.getStatus());
        }

        seat.setLastActivityTime(update.getLastActivityTime());

        Seat savedSeat = seatRepository.save(seat);
        broadcastSeatUpdate(savedSeat);

        return savedSeat;
    }

    public void deleteSeat(String id) {
        seatRepository.deleteById(id);
    }

    public void broadcastSeatUpdate(Seat seat) {
        Map<String, Object> data = new HashMap<>();
        data.put("seatId", seat.getId());
        data.put("floorId", seat.getFloorId());
        data.put("status", seat.getStatus());
        data.put("seatNumber", seat.getSeatNumber());
        webSocketRoomHandler.broadcast("seat_updated", data);
    }
}
