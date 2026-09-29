package com.library.smartlibrary.repositories;

import com.library.smartlibrary.models.Floor;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface FloorRepository extends MongoRepository<Floor, String> {
    Optional<Floor> findByFloorNumber(Integer floorNumber);
}
