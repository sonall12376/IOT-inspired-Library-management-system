package com.library.smartlibrary.controllers;

import com.library.smartlibrary.models.Booking;
import com.library.smartlibrary.security.CustomUserDetails;
import com.library.smartlibrary.services.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    private String getCurrentUserId() {
        try {
            CustomUserDetails details = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return details.getId();
        } catch (Exception e) {
            return null;
        }
    }

    public static class CreateBookingRequest {
        public String seatId;
        public Date startTime;
        public Date endTime;
    }

    public static class ActionRequest {
        public String bookingId;
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<?> getMyBookings() {
        List<Booking> list = bookingService.getStudentBookings(getCurrentUserId());
        return ResponseEntity.ok(Map.of("success", true, "bookings", list));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Booking> list = bookingService.getAllBookings();
        return ResponseEntity.ok(Map.of("success", true, "bookings", list));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateBookingRequest req) {
        try {
            if (req.seatId == null || req.startTime == null || req.endTime == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Seat reference, start time, and end time are required"));
            }
            Booking booking = bookingService.createBooking(getCurrentUserId(), req.seatId, req.startTime, req.endTime);
            return ResponseEntity.status(201).body(Map.of("success", true, "booking", booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody ActionRequest req) {
        try {
            if (req.bookingId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Booking ID reference is required"));
            }
            Booking booking = bookingService.checkIn(req.bookingId, getCurrentUserId());
            return ResponseEntity.ok(Map.of("success", true, "booking", booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkOut(@RequestBody ActionRequest req) {
        try {
            if (req.bookingId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Booking ID reference is required"));
            }
            Booking booking = bookingService.checkOut(req.bookingId, getCurrentUserId());
            return ResponseEntity.ok(Map.of("success", true, "booking", booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/cancel/{id}")
    public ResponseEntity<?> cancel(@PathVariable String id) {
        try {
            Booking booking = bookingService.cancelBooking(id, getCurrentUserId());
            return ResponseEntity.ok(Map.of("success", true, "booking", booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/override-cancel/{id}")
    public ResponseEntity<?> overrideCancel(@PathVariable String id) {
        try {
            Booking booking = bookingService.overrideCancel(id);
            return ResponseEntity.ok(Map.of("success", true, "booking", booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
