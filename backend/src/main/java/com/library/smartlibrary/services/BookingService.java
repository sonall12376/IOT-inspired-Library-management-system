package com.library.smartlibrary.services;

import com.library.smartlibrary.models.Booking;
import com.library.smartlibrary.models.Seat;
import com.library.smartlibrary.repositories.BookingRepository;
import com.library.smartlibrary.repositories.SeatRepository;
import com.library.smartlibrary.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SeatService seatService;

    public List<Booking> getStudentBookings(String studentId) {
        return bookingRepository.findByStudentId(studentId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    public Booking createBooking(String studentId, String seatId, Date startTime, Date endTime) {
        userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new IllegalArgumentException("Seat not found"));

        // Max booking duration check: 4 hours (4 * 60 * 60 * 1000)
        long durationMs = endTime.getTime() - startTime.getTime();
        if (durationMs <= 0 || durationMs > 4L * 60 * 60 * 1000) {
            throw new IllegalArgumentException("Booking duration must be positive and cannot exceed 4 hours");
        }

        // Daily limit check: Max 2 active bookings per day for student (excluding cancelled)
        List<Booking> studentActive = bookingRepository.findByStudentIdAndStatus(studentId, "active");
        List<Booking> studentPending = bookingRepository.findByStudentIdAndStatus(studentId, "pending");
        if ((studentActive.size() + studentPending.size()) >= 2) {
            throw new IllegalArgumentException("Daily booking limit reached. You can only have up to 2 active/pending reservations.");
        }

        // Overlap Check on seat
        List<Booking> overlapList = bookingRepository.findBySeatIdAndStatusNotAndStartTimeLessThanAndEndTimeGreaterThan(
                seatId, "cancelled", endTime, startTime
        );
        if (!overlapList.isEmpty()) {
            throw new IllegalArgumentException("Double Booking Conflict: Seat is already reserved during the requested timeslot.");
        }

        // Reserve seat status
        seat.setStatus("reserved");
        seatRepository.save(seat);
        seatService.broadcastSeatUpdate(seat);

        Booking booking = new Booking();
        booking.setStudentId(studentId);
        booking.setSeatId(seatId);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setStatus("pending");
        booking = bookingRepository.save(booking);

        // Notify student
        notificationService.sendNotification(
                studentId,
                "Reservation Confirmed",
                "Your reservation for seat " + seat.getSeatNumber() + " is confirmed.",
                "success"
        );

        return booking;
    }

    public Booking checkIn(String bookingId, String studentId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking session not found"));

        if (!booking.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("Access denied: Not your reservation");
        }

        if (!"pending".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only pending reservations can be checked-in");
        }

        Date now = new Date();
        booking.setStatus("active");
        booking.setCheckInTime(now);
        booking = bookingRepository.save(booking);

        Seat seat = seatRepository.findById(booking.getSeatId()).orElseThrow();
        seat.setStatus("occupied");
        seatRepository.save(seat);
        seatService.broadcastSeatUpdate(seat);

        notificationService.sendNotification(
                studentId,
                "Check-in Confirmed",
                "Welcome! Your session at seat " + seat.getSeatNumber() + " is now active.",
                "success"
        );

        return booking;
    }

    public Booking checkOut(String bookingId, String studentId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking session not found"));

        if (!booking.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("Access denied");
        }

        if (!"active".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only active sessions can be checked-out");
        }

        Date now = new Date();
        booking.setStatus("completed");
        booking.setCheckOutTime(now);
        booking = bookingRepository.save(booking);

        Seat seat = seatRepository.findById(booking.getSeatId()).orElseThrow();
        seat.setStatus("vacant");
        seatRepository.save(seat);
        seatService.broadcastSeatUpdate(seat);

        notificationService.sendNotification(
                studentId,
                "Check-out Confirmed",
                "Your session at seat " + seat.getSeatNumber() + " has completed.",
                "info"
        );

        return booking;
    }

    public Booking cancelBooking(String bookingId, String studentId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("Access denied");
        }

        if (!"pending".equals(booking.getStatus()) && !"active".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Cannot cancel completed or already cancelled bookings");
        }

        booking.setStatus("cancelled");
        booking = bookingRepository.save(booking);

        Seat seat = seatRepository.findById(booking.getSeatId()).orElseThrow();
        // Return to vacant only if currently reserved/occupied by this user
        if ("reserved".equals(seat.getStatus()) || "occupied".equals(seat.getStatus())) {
            seat.setStatus("vacant");
            seatRepository.save(seat);
            seatService.broadcastSeatUpdate(seat);
        }

        notificationService.sendNotification(
                studentId,
                "Reservation Cancelled",
                "Your reservation for seat " + seat.getSeatNumber() + " has been cancelled.",
                "info"
        );

        return booking;
    }

    public Booking overrideCancel(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        booking.setStatus("cancelled");
        booking = bookingRepository.save(booking);

        Seat seat = seatRepository.findById(booking.getSeatId()).orElseThrow();
        if ("reserved".equals(seat.getStatus()) || "occupied".equals(seat.getStatus())) {
            seat.setStatus("vacant");
            seatRepository.save(seat);
            seatService.broadcastSeatUpdate(seat);
        }

        notificationService.sendNotification(
                booking.getStudentId(),
                "Reservation Terminated by Librarian",
                "Your reservation session at seat " + seat.getSeatNumber() + " was released by library staff.",
                "alert"
        );

        return booking;
    }
}
