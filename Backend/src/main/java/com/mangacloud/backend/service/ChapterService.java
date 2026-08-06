package com.mangacloud.backend.service;

import java.util.List;

import com.mangacloud.backend.dtos.request.ChapterRequest;
import com.mangacloud.backend.dtos.response.ChapterResponse;

public interface ChapterService {
    ChapterResponse createChapter(ChapterRequest request);
    List<ChapterResponse> getChaptersByStorySlug(String storySlug);
    ChapterResponse getChapterDetail(String storySlug, String chapterName);
    ChapterResponse updateChapter(String id, ChapterRequest request);
    void deleteChapter(String id);
}
