package com.dfsg.backend.controller;

import com.dfsg.backend.dto.AuthRequest;
import com.dfsg.backend.dto.AuthResponse;
import com.dfsg.backend.dto.RegisterRequest;
import com.dfsg.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(
            @RequestBody AuthRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<?> getProfile() {
        try {
            return ResponseEntity.ok(service.getProfile());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
