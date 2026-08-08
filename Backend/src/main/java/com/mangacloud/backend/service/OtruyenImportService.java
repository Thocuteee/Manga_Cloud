package com.mangacloud.backend.service;

import com.mangacloud.backend.model.Story;
import java.util.List;
import java.util.Map;

public interface OtruyenImportService {
    Story importStoryBySlug(String slug) throws Exception;
    List<Map<String, Object>> searchOtruyenStories(String keyword);
    void importBatchStoriesAsync(int pages);
    void importBatchStoriesAsync(int startPage, int endPage);
    String formatThumbUrl(String thumbFile);
}
