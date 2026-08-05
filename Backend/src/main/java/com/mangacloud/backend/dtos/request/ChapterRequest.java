package com.mangacloud.backend.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterRequest {
    private String storySlug;
    private String chapterName;
    private String chapterTitle;
    private String chapterApiUrl;
}
