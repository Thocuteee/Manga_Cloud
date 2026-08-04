package com.mangacloud.backend.repository;

import com.mangacloud.backend.model.Chapter;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends MongoRepository<Chapter, String> {

    // Lấy toàn bộ danh sách chương của một bộ truyện
    List<Chapter> findByStorySlug(String storySlug);

    // Tìm chính xác một chương của truyện
    Optional<Chapter> findByStorySlugAndChapterName(String storySlug, String chapterName);

    // Xóa toàn bộ chương của truyện (khi admin xóa truyện)
    void deleteByStorySlug(String storySlug);
}