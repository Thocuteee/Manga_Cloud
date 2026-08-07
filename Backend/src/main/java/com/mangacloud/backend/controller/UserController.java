package com.mangacloud.backend.controller;

import com.mangacloud.backend.dtos.response.UserResponse;
import com.mangacloud.backend.model.User;
import com.mangacloud.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    // 1. Lấy danh sách tất cả người dùng trong hệ thống
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        List<UserResponse> response = users.stream().map(user -> UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatar(user.getAvatar() != null ? user.getAvatar() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100")
                .roles(user.getRoles())
                .status(user.isActive() ? "ACTIVE" : "BANNED")
                .joinedDate(user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "2026-01-01")
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 2. Khóa (Ban) hoặc Mở khóa tài khoản người dùng
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> toggleUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));

        String status = payload.getOrDefault("status", "ACTIVE");
        user.setActive("ACTIVE".equalsIgnoreCase(status));
        userRepository.save(user);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .roles(user.getRoles())
                .status(user.isActive() ? "ACTIVE" : "BANNED")
                .joinedDate(user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "2026-01-01")
                .build();

        return ResponseEntity.ok(response);
    }

    // 3. Cập nhật quyền hạn (Role) tài khoản
    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));

        String role = payload.getOrDefault("role", "ROLE_MEMBER");
        user.setRoles(List.of(role));
        userRepository.save(user);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .roles(user.getRoles())
                .status(user.isActive() ? "ACTIVE" : "BANNED")
                .joinedDate(user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "2026-01-01")
                .build();

        return ResponseEntity.ok(response);
    }
}
