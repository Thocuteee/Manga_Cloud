package com.mangacloud.backend.service;

import com.mangacloud.backend.dtos.request.CommentRequest;
import com.mangacloud.backend.dtos.response.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentService {
    CommentResponse createComment(String username, CommentRequest request);
    
    Page<CommentResponse> getCommentsByStory(String storySlug, Pageable pageable);
    Page<CommentResponse> getCommentsByChapter(String storySlug, String chapterName, Pageable pageable);
    
    void deleteComment(String commentId, String currentUsername);
}
