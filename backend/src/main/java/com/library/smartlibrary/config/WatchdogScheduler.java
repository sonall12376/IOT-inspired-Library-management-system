package com.library.smartlibrary.config;

import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.repositories.SeatRepository;
import com.library.smartlibrary.services.SeatService;
import com.library.smartlibrary.services.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class WatchdogScheduler {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private SeatService seatService;

    @Autowired
    private AuditLogService auditLogService;

    // Run every 10 seconds for dynamic live simulation feedback
    @Scheduled(fixedRate = 10000)
    public void checkInactiveSeats() {
        List<Seat> seats = seatRepository.findAll();
        long now = System.currentTimeMillis();
        long thresholdMs = 45000; // 45 seconds of inactivity before auto-release

        for (Seat seat : seats) {
            if ("occupied".equals(seat.getStatus()) && seat.getLastActivityTime() != null) {
                long diff = now - seat.getLastActivityTime().getTime();
                if (diff > thresholdMs) {
                    seat.setStatus("vacant");
                    seat.setLastActivityTime(null);
                    
                    // Save and broadcast update
                    Seat updated = seatService.updateSeat(seat.getId(), seat);

                    // Audit Log
                    auditLogService.logAction(
                            "SYSTEM_WATCHDOG",
                            "GHOST_RELEASE",
                            "Auto-released seat " + updated.getSeatNumber() + " due to inactive presence detection (exceeded " + (thresholdMs / 1000) + "s threshold).",
                            "127.0.0.1"
                    );
                }
            }
        }
    }
}
