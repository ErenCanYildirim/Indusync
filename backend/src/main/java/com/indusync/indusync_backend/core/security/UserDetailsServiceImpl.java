package com.indusync.indusync_backend.core.security;

import com.indusync.indusync_backend.authentication.domain.User;
import com.indusync.indusync_backend.authentication.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UserDetailsService implementation that loads user details from the database.
 * This service is used by Spring Security for authentication and authorization.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user details for username: {}", username);

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", username);
                    return new UsernameNotFoundException("User not found with email: " + username);
                });

        // Check if the user is active
        if (!user.getActive()) {
            log.warn("User account is deactivated: {}", username);
            throw new UsernameNotFoundException("User account is deactivated: " + username);
        }

        // Check if the user is locked
        if (user.isLocked()) {
            log.warn("User account is locked: {}", username);
            throw new UsernameNotFoundException("User account is locked: " + username);
        }

        // Create authorities based on an account type
        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        // Add a business role if applicable
        if (user.canCreateCompanies()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_BUSINESS"));
        }

        log.debug("Successfully loaded user details for: {}", username);

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail().getValue())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(user.isLocked())
                .credentialsExpired(false)
                .disabled(!user.getActive())
                .build();
    }
}