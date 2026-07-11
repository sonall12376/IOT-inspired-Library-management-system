# Activity Diagrams
## SmartLibrary AI - IoT Based Smart Library Seat Management System

### 1. Activity Diagram: Seat Reservation & Grace Period Flow

This flowchart describes the step-by-step lifecycle logic of booking a seat, checking in via IoT sensors, and handling auto-cancellation.

```mermaid
flowchart TD
    start([Start Reservation]) --> select_seat[Student Selects Seat & Time]
    select_seat --> validate_quota{Verify Student Quota & Overlaps}
    
    validate_quota -- "Invalid" --> show_err[Display Error Alert] --> start
    validate_quota -- "Valid" --> create_pending_booking[Create Pending Booking]
    
    create_pending_booking --> lock_seat[Set Seat Status to Reserved]
    lock_seat --> start_timer[Start 15-Minute Grace Timer]
    
    start_timer --> wait_sensor{Wait for Sensor Occupancy Update}
    
    wait_sensor -- "Occupancy Detected state=1" --> mark_active[Change Booking to Active]
    mark_active --> set_occupied[Change Seat Status to Occupied]
    set_occupied --> end_flow([End Process])

    wait_sensor -- "15 Minutes Expired & state=0" --> release_seat[Change Seat Status to Vacant]
    release_seat --> cancel_booking[Change Booking to No-Show]
    cancel_booking --> notify_user[Send Notification: Booking Cancelled]
    notify_user --> end_flow
```

---

### 2. Activity Diagram: Device Watchdog & Heartbeat Lifecycle

This flowchart describes the background polling system that continuously monitors hardware connectivity.

```mermaid
flowchart TD
    start_daemon([Start Watchdog Cron every 60s]) --> get_devices[Fetch all Online Devices]
    get_devices --> check_loop{For each Device}
    
    check_loop -- "Done" --> end_daemon([End Cron Run])
    
    check_loop -- "Next Device" --> calculate_delta[Calculate: Time Since Last Heartbeat]
    calculate_delta --> check_threshold{Is delta > 180 seconds?}
    
    check_threshold -- "No (Device is Healthy)" --> check_loop
    
    check_threshold -- "Yes (Offline)" --> set_device_offline[Update Device Status to Offline]
    set_device_offline --> check_seat_assignment{Is Device Bound to a Seat?}
    
    check_seat_assignment -- "No" --> check_loop
    check_seat_assignment -- "Yes" --> set_seat_offline[Set Seat Status to Offline]
    set_seat_offline --> broadcast_update[Broadcast WebSocket Event 'seat_status_update']
    broadcast_update --> notify_librarian[Create Alert Notification for Operators]
    notify_librarian --> check_loop
```
