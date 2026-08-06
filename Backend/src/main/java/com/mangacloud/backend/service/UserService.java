package com.mangacloud.backend.service;

import com.mangacloud.backend.dtos.response.AuthResponse;
import com.mangacloud.backend.dtos.request.LoginRequest;
import com.mangacloud.backend.dtos.request.RegisterRequest;
import com.mangacloud.backend.dtos.response.UserResponse;

public interface UserService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(String username);
}
