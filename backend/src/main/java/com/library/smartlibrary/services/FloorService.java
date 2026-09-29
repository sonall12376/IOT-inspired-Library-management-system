package com.library.smartlibrary.services;

import com.library.smartlibrary.models.Floor;
import com.library.smartlibrary.repositories.FloorRepository;
import com.library.smartlibrary.repositories.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class FloorService {

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private SeatRepository seatRepository;

    public List<Floor> getAllFloors() {
        return floorRepository.findAll();
    }

    public Optional<Floor> getFloorById(String id) {
        return floorRepository.findById(id);
    }

    public Optional<Floor> getFloorByNumber(Integer number) {
        return floorRepository.findByFloorNumber(number);
    }

    public Floor createFloor(Floor floor) {
        if (floorRepository.findByFloorNumber(floor.getFloorNumber()).isPresent()) {
            throw new IllegalArgumentException("Floor number " + floor.getFloorNumber() + " already exists");
        }
        return floorRepository.save(floor);
    }

    public Floor updateFloor(String id, Floor update) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));

        if (update.getFloorNumber() != null && !update.getFloorNumber().equals(floor.getFloorNumber())) {
            if (floorRepository.findByFloorNumber(update.getFloorNumber()).isPresent()) {
                throw new IllegalArgumentException("Floor number already exists");
            }
            floor.setFloorNumber(update.getFloorNumber());
        }

        if (update.getName() != null) {
            floor.setName(update.getName());
        }

        if (update.getGridDimensions() != null) {
            floor.setGridDimensions(update.getGridDimensions());
        }

        if (update.getSvgLayoutPath() != null) {
            floor.setSvgLayoutPath(update.getSvgLayoutPath());
        }

        return floorRepository.save(floor);
    }

    public void deleteFloor(String id) {
        // Cascade delete: delete all seats associated with this floor
        floorRepository.deleteById(id);
        seatRepository.deleteAll(seatRepository.findByFloorId(id));
    }
}
