package com.mangacloud.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chapters")
public class Chapter {
    @Id
    private String id;

    @Field("story_slug")
    private String storySlug;      // Đã đổi từ storyId sang storySlug chuẩn theo ý bạn

    @Field("chapter_name")
    private String chapterName;    // VD: "1", "10.5"

    @Field("chapter_title")
    private String chapterTitle;   // VD: "Khởi đầu mới"

    @Field("chapter_api_url")
    private String chapterApiUrl;  // Link API lấy chi tiết trang ảnh của chương đó từ OTruyen

    @Field("updated_at")
    private LocalDateTime updatedAt;
}
