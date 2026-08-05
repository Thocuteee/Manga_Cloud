package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.CommentRequest;
import com.mangacloud.backend.dtos.response.CommentResponse;
import com.mangacloud.backend.model.Comment;
import com.mangacloud.backend.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class CommentMapper {
    public Comment toEntity(CommentRequest request, User currentUser, String userAvatarUrl) {
        if (request == null) return null;

        return Comment.builder()
                .storySlug(request.getStorySlug())
                .chapterName(request.getChapterName())
                .userId(currentUser.getId())
                .userName(currentUser.getUsername())
                .userAvatar(userAvatarUrl) // Avatar lấy từ User profile
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();
    }

    public CommentResponse toResponse(Comment comment) {
        if (comment == null) return null;

        return CommentResponse.builder()
                .id(comment.getId())
                .storySlug(comment.getStorySlug())
                .chapterName(comment.getChapterName())
                .userId(comment.getUserId())
                .userName(comment.getUserName())
                .userAvatar(comment.getUserAvatar())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
