package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.CommentRequest;
import com.mangacloud.backend.dtos.response.CommentResponse;
import com.mangacloud.backend.model.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CommentMapper {
    CommentResponse toResponse(Comment comment);

    List<CommentResponse> toResponseList(List<Comment> comments);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "userName", ignore = true)
    @Mapping(target = "userAvatar", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Comment toEntity(CommentRequest request);
}
