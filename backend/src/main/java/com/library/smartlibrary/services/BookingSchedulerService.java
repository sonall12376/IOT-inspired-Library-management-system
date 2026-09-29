package com.library.smartlibrary.services;

import com.library.smartlibrary.models.*;
import com.library.smartlibrary.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
@SuppressWarnings("null")
public class BookingSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(BookingSchedulerService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SeatService seatService;

    @Value("${booking.scheduler.grace-minutes:15}")
    private int graceMinutes;

    @Scheduled(fixedRateString = "${booking.scheduler.sweep-rate-ms:60000}")
    public void sweep() {
        // Exclude in tests unless manually triggered
        String activeProfile = System.getProperty("spring.profiles.active");
        if ("test".equals(activeProfile) && graceMinutes > 1) {
            return;
        }

        try {
            Date now = new Date();

            // 1. Process 15-minute pending grace window expiry (No-show triggers)
            Date graceTime = new Date(now.getTime() - graceMinutes * 60 * 1000);
            List<Booking> staleBookings = bookingRepository.findByStatusAndStartTimeBefore("pending", graceTime);

            for (Booking booking : staleBookings) {
                booking.setStatus("no-show");
                bookingRepository.save(booking);
                log.info("[Booking Scheduler] Booking {} set to no-show (grace window expired).", booking.getId());

                Seat seat = seatRepository.findById(booking.getSeatId()).orElse(null);
                if (seat != null && ("reserved".equals(seat.getStatus()) || "occupied".equals(seat.getStatus()))) {
                    seat.setStatus("vacant");
                    seatRepository.save(seat);
                    seatService.broadcastSeatUpdate(seat);
                }

                // Notify student
                notificationService.sendNotification(
                        booking.getStudentId(),
                        "Reservation Expired (No-Show)",
                        "Your reservation for seat " + (seat != null ? seat.getSeatNumber() : "N/A") + " was cancelled due to check-in grace window timeout.",
                        "alert"
                );
            }

            // 2. Process booking end-time auto-completion
            List<Booking> completedBookings = bookingRepository.findByStatusAndEndTimeBefore("active", now);

            for (Booking booking : completedBookings) {
                booking.setStatus("completed");
                booking.setCheckOutTime(now);
                bookingRepository.save(booking);
                log.info("[Booking Scheduler] Booking {} auto-completed (endTime reached).", booking.getId());

                Seat seat = seatRepository.findById(booking.getSeatId()).orElse(null);
                if (seat != null && ("occupied".equals(seat.getStatus()) || "reserved".equals(seat.getStatus()))) {
                    seat.setStatus("vacant");
                    seatRepository.save(seat);
                    seatService.broadcastSeatUpdate(seat);
                }

                // Notify student
                notificationService.sendNotification(
                        booking.getStudentId(),
                        "Session Auto-Completed",
                        "Your reservation session at seat " + (seat != null ? seat.getSeatNumber() : "N/A") + " has completed.",
                        "info"
                );
            }

            // 3. Process temporary absence warning (10m) and release (20m) (FR-4.6)
            List<Booking> absentBookings = bookingRepository.findByStatusAndAbsenceStartedAtIsNotNull("active");

            for (Booking booking : absentBookings) {
                if (booking.getAbsenceStartedAt() == null) continue;

                long absentDurationMs = now.getTime() - booking.getAbsenceStartedAt().getTime();
                long minutesAway = absentDurationMs / (60 * 1000);

                Seat seat = seatRepository.findById(booking.getSeatId()).orElse(null);

                if (minutesAway >= 20) {
                    // Release session
                    booking.setStatus("completed");
                    booking.setCheckOutTime(now);
                    booking.setAbsenceStartedAt(null);
                    booking.setAbsenceWarningSent(false);
                    bookingRepository.save(booking);

                    if (seat != null && ("occupied".equals(seat.getStatus()) || "reserved".equals(seat.getStatus()))) {
                        seat.setStatus("vacant");
                        seatRepository.save(seat);
                        seatService.broadcastSeatUpdate(seat);
                    }

                    notificationService.sendNotification(
                            booking.getStudentId(),
                            "Reservation Terminated due to Absence",
                            "Your reservation session at seat " + (seat != null ? seat.getSeatNumber() : "N/A") + " was auto-terminated because your absence exceeded 20 minutes.",
                            "alert"
                    );
                    log.info("[Booking Scheduler] Terminated booking {} due to 20m absence.", booking.getId());

                } else if (minutesAway >= 10 && !booking.isAbsenceWarningSent()) {
                    // Send warning alert
                    booking.setAbsenceWarningSent(true);
                    bookingRepository.save(booking);

                    notificationService.sendNotification(
                            booking.getStudentId(),
                            "Temporary Absence Warning",
                            "You have been away from seat " + (seat != null ? seat.getSeatNumber() : "N/A") + " for 10 minutes. Your booking will be terminated if you do not return within 10 more minutes.",
                            "warning"
                    );
                    log.info("[Booking Scheduler] Sent absence warning for booking {} on seat {}.", booking.getId(), seat != null ? seat.getSeatNumber() : "N/A");
                }
            }

            // 4. Auto-reserve seats when pending upcoming booking slots start immediately
            List<Booking> upcomingBookings = bookingRepository.findByStatus("pending");
            for (Booking booking : upcomingBookings) {
                if (booking.getStartTime().getTime() <= now.getTime() && booking.getEndTime().getTime() >= now.getTime()) {
                    Seat seat = seatRepository.findById(booking.getSeatId()).orElse(null);
                    if (seat != null && "vacant".equals(seat.getStatus())) {
                        seat.setStatus("reserved");
                        seatRepository.save(seat);
                        seatService.broadcastSeatUpdate(seat);
                        log.info("[Booking Scheduler] Seat {} set to reserved (booking slot started).", seat.getSeatNumber());
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error in Booking Scheduler sweep process: {}", e.getMessage());
        }
    }
}
