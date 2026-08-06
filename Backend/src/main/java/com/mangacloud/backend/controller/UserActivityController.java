package com.mangacloud.backend.controller;

import com.mangacloud.backend.dtos.request.BookmarkRequest;
import com.mangacloud.backend.dtos.request.HistoryRequest;
import com.mangacloud.backend.dtos.response.UserActivityResponse;
import com.mangacloud.backend.exception.ResourceNotFoundException;
import com.mangacloud.backend.model.User;
import com.mangacloud.backend.repository.UserRepository;
import com.mangacloud.backend.service.UserActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user-activities")
@RequiredArgsConstructor
public class UserActivityController {
    private final UserActivityService userActivityService;
    private final UserRepository userRepository;

    // Helper: Lấy userId từ Token JWT đăng nhập
    private String getUserIdFromAuth(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + username));
        return user.getId();
    }

    // 1. Lấy danh sách Bookmark & Lịch sử đọc của cá nhân
    @GetMapping("/me")
    public ResponseEntity<UserActivityResponse> getMyActivity(Authentication authentication) {
        String userId = getUserIdFromAuth(authentication);
        UserActivityResponse response = userActivityService.getUserActivity(userId);
        return ResponseEntity.ok(response);
    }

    // 2. Toggle Bookmark (Lưu / Hủy lưu bộ truyện)
    @PostMapping("/bookmark")
    public ResponseEntity<UserActivityResponse> toggleBookmark(
            Authentication authentication,
            @Valid @RequestBody BookmarkRequest request) {
        String userId = getUserIdFromAuth(authentication);
        UserActivityResponse response = userActivityService.toggleBookmark(userId, request);
        return ResponseEntity.ok(response);
    }

    // 3. Lưu lịch sử mỗi khi đọc chapter mới
    @PostMapping("/history")
    public ResponseEntity<UserActivityResponse> saveHistory(
            Authentication authentication,
            @Valid @RequestBody HistoryRequest request) {
        String userId = getUserIdFromAuth(authentication);
        UserActivityResponse response = userActivityService.saveHistory(userId, request);
        return ResponseEntity.ok(response);
    }

    // 4. Xóa 1 truyện khỏi lịch sử đọc
    @DeleteMapping("/history/{storySlug}")
    public ResponseEntity<UserActivityResponse> removeHistory(
            Authentication authentication,
            @PathVariable String storySlug) {
        String userId = getUserIdFromAuth(authentication);
        UserActivityResponse response = userActivityService.removeHistory(userId, storySlug);
        return ResponseEntity.ok(response);
    }
}
