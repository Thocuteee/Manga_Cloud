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
    public ResponseEntity<Map<String, Object>> importBatchStories(@RequestParam(defaultValue = "3") int pages) {
        Map<String, Object> response = new HashMap<>();

        // Kích hoạt tiến trình ngầm qua Spring AOP Proxy
        otruyenImportService.importBatchStoriesAsync(pages);

        response.put("success", true);
        response.put("message", "Đã khởi chạy tiến trình cào dữ liệu ngầm cho " + pages + " trang! Truyện sẽ tự động đổ về Database trong ít phút.");
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
