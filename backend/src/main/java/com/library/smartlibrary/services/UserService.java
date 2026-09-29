package com.library.smartlibrary.services;

import com.library.smartlibrary.models.RefreshToken;
import com.library.smartlibrary.models.User;
import com.library.smartlibrary.repositories.RefreshTokenRepository;
import com.library.smartlibrary.repositories.UserRepository;
import com.library.smartlibrary.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
@SuppressWarnings("null")
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(String name, String email, String password) {
        if (userRepository.findByEmail(email.toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("User with email " + email + " is already registered");
        }

        // System rule: The first registered user receives "admin" role
        long userCount = userRepository.count();
        String role = (userCount == 0) ? "admin" : "student";

        User user = new User();
        user.setName(name);
        user.setEmail(email.toLowerCase());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase());
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public boolean comparePassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    public String createAccessToken(User user) {
        return jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
    }

    public RefreshToken createRefreshToken(User user) {
        // Expiration threshold: 7 days
        Date expiryDate = new Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000);
        String tokenString = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken(tokenString, user.getId(), expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    public void revokeRefreshToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    public void revokeUserRefreshTokens(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public Optional<RefreshToken> getRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public Optional<User> findByResetPasswordToken(String token) {
        return userRepository.findByResetPasswordToken(token);
    }
}
