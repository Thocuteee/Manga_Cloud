package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.StoryRequest;
import com.mangacloud.backend.dtos.response.StoryResponse;
import com.mangacloud.backend.model.Story;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StoryMapper {
    StoryResponse toResponse(Story story);

    List<StoryResponse> toResponseList(List<Story> stories);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true) // Slug sẽ được SlugUtil tự tạo trong Service
    Story toEntity(StoryRequest request);
}
