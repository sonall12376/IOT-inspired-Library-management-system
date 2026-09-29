package com.library.smartlibrary.repositories;

import com.library.smartlibrary.models.Device;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends MongoRepository<Device, String> {
    Optional<Device> findByMacAddress(String macAddress);
    List<Device> findByStatusAndLastHeartbeatBefore(String status, Date heartbeatThreshold);
}
