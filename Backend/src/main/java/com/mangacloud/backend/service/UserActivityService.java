package com.mangacloud.backend.service;

import com.mangacloud.backend.dtos.request.BookmarkRequest;
import com.mangacloud.backend.dtos.request.HistoryRequest;
import com.mangacloud.backend.dtos.response.UserActivityResponse;

public interface UserActivityService {
    UserActivityResponse getUserActivity(String userId);
    UserActivityResponse toggleBookmark(String userId, BookmarkRequest request);
    UserActivityResponse saveHistory(String userId, HistoryRequest request);
    UserActivityResponse removeHistory(String userId, String storySlug);
}
