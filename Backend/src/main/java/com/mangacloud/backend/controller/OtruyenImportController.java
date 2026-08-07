package com.mangacloud.backend.controller;

import com.mangacloud.backend.model.Story;
import com.mangacloud.backend.service.OtruyenImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/import-otruyen")
@RequiredArgsConstructor
public class OtruyenImportController {

    private final OtruyenImportService otruyenImportService;

    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> importBatchStories(
            @RequestParam(required = false) Integer startPage,
            @RequestParam(required = false) Integer endPage,
            @RequestParam(defaultValue = "5") int pages) {
        Map<String, Object> response = new HashMap<>();

        int from = (startPage != null && startPage > 0) ? startPage : 1;
        int to = (endPage != null && endPage >= from) ? endPage : (startPage != null ? startPage : pages);

        // Kích hoạt tiến trình ngầm qua Spring AOP Proxy
        otruyenImportService.importBatchStoriesAsync(from, to);

        int totalExpected = (to - from + 1) * 24;
        response.put("success", true);
        response.put("message", "🚀 Đã khởi chạy cào ngầm từ Trang " + from + " đến Trang " + to + " (~" + totalExpected + " bộ truyện)! Truyện đang tự động nạp vào Database.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{slug}")
    public ResponseEntity<Map<String, Object>> importStoryBySlug(@PathVariable String slug) {
        Map<String, Object> response = new HashMap<>();
        try {
            Story storyEntity = otruyenImportService.importStoryBySlug(slug);
            if (storyEntity != null) {
                response.put("success", true);
                response.put("message", "Đã import bộ truyện \"" + storyEntity.getName() + "\" thành công!");
                response.put("story", storyEntity);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy bộ truyện hoặc không thể lấy dữ liệu từ Otruyen API!");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi trong quá trình Import: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
