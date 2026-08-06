package com.mangacloud.backend.service.impl;

import com.mangacloud.backend.dtos.request.LoginRequest;
import com.mangacloud.backend.dtos.request.RegisterRequest;
import com.mangacloud.backend.dtos.response.AuthResponse;
import com.mangacloud.backend.dtos.response.UserResponse;
import com.mangacloud.backend.exception.ResourceNotFoundException;
import com.mangacloud.backend.mapper.UserMapper;
import com.mangacloud.backend.model.User;
import com.mangacloud.backend.repository.UserRepository;
import com.mangacloud.backend.service.UserService;
import com.mangacloud.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService{
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Lỗi: Username đã tồn tại!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Lỗi: Email đã được sử dụng!");
        }

        // 1. Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 2. Tận dụng UserMapper để tạo Entity
        User user = userMapper.toEntity(request, encodedPassword);
        userRepository.save(user);

        // 3. Tạo JWT Token
        String token = jwtUtil.generateToken(user.getUsername());

        // 4. Tận dụng UserMapper để tạo AuthResponse
        AuthResponse response = userMapper.toAuthResponse(user);
        response.setToken(token); 
        return response;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // Xác thực qua Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );

        // Tìm User trong DB
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng!")));

        String token = jwtUtil.generateToken(user.getUsername());

        // Tận dụng UserMapper
        AuthResponse response = userMapper.toAuthResponse(user);
        response.setToken(token);
        return response;
    }

    @Override
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng: " + username));
        
        // Chuyển từ User Entity sang UserResponse
        return userMapper.toUserResponse(user);
    }
}
