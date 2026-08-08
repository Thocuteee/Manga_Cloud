package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.ChapterRequest;
import com.mangacloud.backend.dtos.response.ChapterResponse;
import com.mangacloud.backend.model.Chapter;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ChapterMapper {
    ChapterResponse toResponse(Chapter chapter);

    List<ChapterResponse> toResponseList(List<Chapter> chapters);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Chapter toEntity(ChapterRequest request);
}
