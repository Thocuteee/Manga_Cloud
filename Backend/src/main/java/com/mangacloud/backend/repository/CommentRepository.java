package com.mangacloud.backend.repository;

import com.mangacloud.backend.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByStorySlug(String storySlug, Pageable pageable);

    // Lấy comment của một chương cụ thể
    Page<Comment> findByStorySlugAndChapterName(String storySlug, String chapterName, Pageable pageable);
}