package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.ChapterRequest;
import com.mangacloud.backend.dtos.response.ChapterResponse;
import com.mangacloud.backend.model.Chapter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ChapterMapper {
    public Chapter toEntity(ChapterRequest req) {
        if (req == null) return null;

        return Chapter.builder()
                .storySlug(req.getStorySlug())
                .chapterName(req.getChapterName())
                .chapterTitle(req.getChapterTitle())
                .chapterApiUrl(req.getChapterApiUrl())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public ChapterResponse toResponse(Chapter chapter) {
        if (chapter == null) return null;

        return ChapterResponse.builder()
                .id(chapter.getId())
                .storySlug(chapter.getStorySlug())
                .chapterName(chapter.getChapterName())
                .chapterTitle(chapter.getChapterTitle())
                .chapterApiUrl(chapter.getChapterApiUrl())
                .updatedAt(chapter.getUpdatedAt())
                .build();
    }
}
