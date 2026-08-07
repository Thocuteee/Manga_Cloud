package com.mangacloud.backend.service;

import com.mangacloud.backend.model.Story;

public interface OtruyenImportService {
    Story importStoryBySlug(String slug) throws Exception;
    void importBatchStoriesAsync(int pages);
    void importBatchStoriesAsync(int startPage, int endPage);
    String formatThumbUrl(String thumbFile);
}
