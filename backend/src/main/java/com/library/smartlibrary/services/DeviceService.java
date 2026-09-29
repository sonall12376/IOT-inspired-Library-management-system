package com.library.smartlibrary.services;

import com.library.smartlibrary.models.Device;
import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.repositories.DeviceRepository;
import com.library.smartlibrary.repositories.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SeatRepository seatRepository;

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }

    public Optional<Device> getDeviceById(String id) {
        return deviceRepository.findById(id);
    }

    public Optional<Device> getDeviceByMacAddress(String macAddress) {
        return deviceRepository.findByMacAddress(macAddress.toUpperCase());
    }

    public Device createDevice(Device device) {
        String cleanMac = device.getMacAddress().toUpperCase().trim();
        if (deviceRepository.findByMacAddress(cleanMac).isPresent()) {
            throw new IllegalArgumentException("Device with MAC address " + cleanMac + " is already registered");
        }
        device.setMacAddress(cleanMac);
        return deviceRepository.save(device);
    }

    public Device updateDevice(String id, Device update) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Device not found"));

        if (update.getMacAddress() != null) {
            String cleanMac = update.getMacAddress().toUpperCase().trim();
            if (!cleanMac.equals(device.getMacAddress())) {
                if (deviceRepository.findByMacAddress(cleanMac).isPresent()) {
                    throw new IllegalArgumentException("MAC address already registered");
                }
                device.setMacAddress(cleanMac);
            }
        }

        if (update.getDeviceName() != null) {
            device.setDeviceName(update.getDeviceName());
        }

        if (update.getStatus() != null) {
            device.setStatus(update.getStatus());
        }

        if (update.getFirmwareVersion() != null) {
            device.setFirmwareVersion(update.getFirmwareVersion());
        }

        device.setRssi(update.getRssi());
        if (update.getBatteryPercentage() != null) {
            device.setBatteryPercentage(update.getBatteryPercentage());
        }

        return deviceRepository.save(device);
    }

    public void deleteDevice(String id) {
        // Cascade: unbind device ID from any seats
        List<Seat> boundSeats = seatRepository.findByDeviceId(id);
        for (Seat seat : boundSeats) {
            seat.setDeviceId(null);
            seatRepository.save(seat);
        }
        deviceRepository.deleteById(id);
    }
}
