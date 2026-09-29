package com.library.smartlibrary.config;

import com.library.smartlibrary.models.Floor;
import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.models.Device;
import com.library.smartlibrary.repositories.FloorRepository;
import com.library.smartlibrary.repositories.SeatRepository;
import com.library.smartlibrary.repositories.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seed Floor 1 if it doesn't exist
        Optional<Floor> floorOpt = floorRepository.findByFloorNumber(1);
        Floor floor;
        if (floorOpt.isEmpty()) {
            floor = new Floor();
            floor.setFloorNumber(1);
            floor.setName("Main Library Floor");
            floor.setGridDimensions(new Floor.GridDimensions(10, 10));
            floor.setCreatedAt(new Date());
            floor.setUpdatedAt(new Date());
            floor = floorRepository.save(floor);
            System.out.println("Seeded Floor 1: Main Library Floor");
        } else {
            floor = floorOpt.get();
        }

        // Clear existing seats to recreate them with correct grid coordinates
        seatRepository.deleteAll();

        // Seed Seats
        for (int i = 1; i <= 15; i++) {
            String pad = String.format("%03d", i);
            String seatNum = "S-" + pad;
            String mac = String.format("24:0A:C4:8B:%02X:FC", i);

            // Create a Device document
            Optional<Device> deviceOpt = deviceRepository.findByMacAddress(mac);
            Device device;
            if (deviceOpt.isEmpty()) {
                device = new Device();
                device.setMacAddress(mac);
                device.setDeviceName("Sensor Node " + pad);
                device.setStatus("offline");
                device.setCreatedAt(new Date());
                device.setUpdatedAt(new Date());
                device = deviceRepository.save(device);
            } else {
                device = deviceOpt.get();
            }

            // Create a Seat document
            Seat seat = new Seat();
            seat.setSeatNumber(seatNum);
            seat.setFloorId(floor.getId());
            seat.setRoomName("main_hall");
            seat.setSeatType(i % 5 == 0 ? "sofa" : "desk");
            seat.setHasPowerOutlet(i % 2 == 0);
            seat.setIsNearWindow(i % 3 == 0);
            
            // Grid coordinates must be positive integers matching the grid boundaries (e.g. 1-10)
            int x = 1 + ((i - 1) % 5);
            int y = 1 + ((i - 1) / 5);
            seat.setCoordinates(new Seat.Coordinates(x, y));
            seat.setStatus("vacant");
            seat.setDeviceId(device.getId());
            seat.setCreatedAt(new Date());
            seat.setUpdatedAt(new Date());
            seatRepository.save(seat);
        }
        System.out.println("Seeded 15 Seats for Floor 1 with grid coordinates");
    }
}
