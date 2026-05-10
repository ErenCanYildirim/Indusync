package com.indusync.indusync_backend.authentication.application.service;

import com.indusync.indusync_backend.authentication.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserLookupService {
    private final UserRepository userRepository;

    public Optional<String> getUserEmail(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> user.getEmail() != null ? user.getEmail().getValue() : null)
                .filter(email -> !email.isBlank());
    }
} 