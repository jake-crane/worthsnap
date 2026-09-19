package com.worthsnap.service.controller;

import com.worthsnap.service.dto.CurrentUserDto;
import com.worthsnap.service.entity.User;
import com.worthsnap.service.repository.UserRepository;
import com.worthsnap.service.security.AppPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public CurrentUserDto me(@AuthenticationPrincipal AppPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        User user = userRepository
                .findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return new CurrentUserDto(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl());
    }
}
