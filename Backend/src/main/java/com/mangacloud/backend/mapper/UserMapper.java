package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.RegisterRequest;
import com.mangacloud.backend.dtos.response.UserResponse;
import com.mangacloud.backend.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class UserMapper {
    public User toEntity(RegisterRequest req, String encodedPassword) {
        if(req == null) return null;
        return User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(encodedPassword)
                .roles(List.of("ROLE_MEMBER")) // Mặc định đăng ký mới là Member
                .createdAt(LocalDateTime.now())
                .build();
    }

    public UserResponse toResponse(User user) {
        if(user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
