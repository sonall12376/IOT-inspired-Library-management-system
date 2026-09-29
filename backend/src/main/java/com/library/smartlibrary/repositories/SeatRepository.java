package com.library.smartlibrary.repositories;

import com.library.smartlibrary.models.Seat;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SeatRepository extends MongoRepository<Seat, String> {
    List<Seat> findByFloorId(String floorId);
    Optional<Seat> findBySeatNumberAndFloorId(String seatNumber, String floorId);
    Optional<Seat> findBySeatNumber(String seatNumber);
    List<Seat> findByDeviceId(String deviceId);
}
