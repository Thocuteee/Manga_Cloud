package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.StoryRequest;
import com.mangacloud.backend.dtos.response.StoryResponse;
import com.mangacloud.backend.model.Story;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class StoryMapper {
    public Story toEntity(StoryRequest req) {
        if (req == null) return null;

        return Story.builder()
                .name(req.getName())
                .slug(req.getSlug())
                .originName(req.getOriginName())
                .thumbUrl(req.getThumbUrl())
                .author(req.getAuthor())
                .categories(req.getCategories())
                .status(req.getStatus())
                .summary(req.getSumary())
                .viewCount(0) // Mặc định khi tạo mới view = 0
                .isPublic(req.isPublic())
                .updateAt(LocalDateTime.now())
                .build();
    }

    public StoryResponse toResponse(Story story) {
        if (story == null) return null;

        return StoryResponse.builder()
                .id(story.getId())
                .name(story.getName())
                .slug(story.getSlug())
                .originName(story.getOriginName())
                .thumbUrl(story.getThumbUrl())
                .author(story.getAuthor())
                .categories(story.getCategories())
                .status(story.getStatus())
                .summary(story.getSummary())
                .viewCount(story.getViewCount())
                .isPublic(story.isPublic())
                .updateAt(story.getUpdateAt())
                .build();
    }
}
