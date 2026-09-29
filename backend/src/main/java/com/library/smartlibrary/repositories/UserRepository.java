package com.library.smartlibrary.repositories;

import com.library.smartlibrary.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetPasswordToken(String token);
}
