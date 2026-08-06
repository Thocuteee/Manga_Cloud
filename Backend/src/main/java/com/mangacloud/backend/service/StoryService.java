package com.mangacloud.backend.service;

import java.util.List;

import com.mangacloud.backend.dtos.request.StoryRequest;
import com.mangacloud.backend.dtos.response.StoryResponse;

public interface StoryService {
    StoryResponse createStory(StoryRequest request);
    StoryResponse getStoryBySlug(String slug);
    List<StoryResponse> getAllStories();
    StoryResponse updateStory(String id, StoryRequest request);
    void deleteStory(String id);
}
