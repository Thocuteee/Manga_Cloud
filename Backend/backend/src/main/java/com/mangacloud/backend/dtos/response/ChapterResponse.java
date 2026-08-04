package com.mangacloud.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterResponse {
    private String id;
    private String storySlug;
    private String chapterName;
    private String chapterTitle;
    private String chapterApiUrl;
    private LocalDateTime updatedAt;
}
