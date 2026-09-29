package com.library.smartlibrary.repositories;

import com.library.smartlibrary.models.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Date;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByStudentId(String studentId);
    List<Booking> findByStudentIdAndStatus(String studentId, String status);
    List<Booking> findBySeatId(String seatId);
    List<Booking> findByStatus(String status);
    
    // For pending grace release sweeps: status='pending' and startTime < graceTime
    List<Booking> findByStatusAndStartTimeBefore(String status, Date startTime);

    // For active auto-complete sweeps: status='active' and endTime < now
    List<Booking> findByStatusAndEndTimeBefore(String status, Date endTime);

    // For temporary absence sweeps: status='active' and absenceStartedAt exists
    List<Booking> findByStatusAndAbsenceStartedAtIsNotNull(String status);

    // For active/pending overlays and MQTT state checks: active booking at current time
    List<Booking> findBySeatIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
        String seatId, String status, Date startCompare, Date endCompare
    );
    
    // To check overlap: any booking on seat during start to end timeslot, excluding cancelled
    List<Booking> findBySeatIdAndStatusNotAndStartTimeLessThanAndEndTimeGreaterThan(
        String seatId, String statusNot, Date end, Date start
    );
}
