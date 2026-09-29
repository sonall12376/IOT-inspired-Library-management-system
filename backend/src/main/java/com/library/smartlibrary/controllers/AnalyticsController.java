package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.repositories.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    @Autowired
    private SeatRepository seatRepository;

    @GetMapping("/occupancy")
    public ResponseEntity<?> getOccupancyAnalytics() {
        List<Seat> seats = seatRepository.findAll();
        
        // 1. Calculate Seat Type Preferences
        Map<String, Integer> totalByType = new HashMap<>();
        Map<String, Integer> occupiedByType = new HashMap<>();

        for (Seat seat : seats) {
            String type = seat.getSeatType() != null ? seat.getSeatType() : "desk";
            totalByType.put(type, totalByType.getOrDefault(type, 0) + 1);
            if ("occupied".equals(seat.getStatus())) {
                occupiedByType.put(type, occupiedByType.getOrDefault(type, 0) + 1);
            }
        }

        List<Map<String, Object>> typeStats = new ArrayList<>();
        for (String type : totalByType.keySet()) {
            Map<String, Object> stat = new HashMap<>();
            stat.put("name", type.toUpperCase());
            stat.put("total", totalByType.get(type));
            stat.put("occupied", occupiedByType.getOrDefault(type, 0));
            typeStats.add(stat);
        }

        // 2. Mock Peak Hourly Occupancy distribution (since it is a real-time demo, we blend real status with typical peak values)
        int currentOccupied = occupiedByType.values().stream().mapToInt(Integer::intValue).sum();
        int totalSeats = seats.size();
        
        List<Map<String, Object>> hourlyStats = new ArrayList<>();
        int[] multipliers = {10, 15, 20, 35, 55, 75, 85, 90, 80, 65, 45, 20};
        String[] hours = {"08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"};
        
        for (int i = 0; i < hours.length; i++) {
            Map<String, Object> hourStat = new HashMap<>();
            hourStat.put("time", hours[i]);
            // Dynamically scale mockup data based on total seats and peak multipliers
            int mockOccupied = (int) Math.round((multipliers[i] / 100.0) * totalSeats);
            if (mockOccupied > totalSeats) mockOccupied = totalSeats;
            
            // Blend current real occupied seats into the current time frame (approx. 14:00 to 16:00)
            if (i == 6 || i == 7) { // 14:00 - 15:00
                hourStat.put("occupied", Math.max(currentOccupied, mockOccupied));
            } else {
                hourStat.put("occupied", mockOccupied);
            }
            hourStat.put("capacity", totalSeats);
            hourlyStats.add(hourStat);
        }

        // 3. Average duration & summary metrics
        Map<String, Object> summary = new HashMap<>();
        summary.put("averageDurationMinutes", 78);
        summary.put("activeAlerts", 0);
        summary.put("totalAlertsCount", 4);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("typeStats", typeStats);
        response.put("hourlyStats", hourlyStats);
        response.put("summary", summary);

        return ResponseEntity.ok(response);
    }
}
