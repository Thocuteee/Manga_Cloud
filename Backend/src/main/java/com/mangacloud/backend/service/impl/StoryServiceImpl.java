package com.mangacloud.backend.service.impl;

import com.mangacloud.backend.dtos.request.StoryRequest;
import com.mangacloud.backend.dtos.response.StoryResponse;
import com.mangacloud.backend.exception.ResourceNotFoundException;
import com.mangacloud.backend.mapper.StoryMapper;
import com.mangacloud.backend.model.Story;
import com.mangacloud.backend.repository.StoryRepository;
import com.mangacloud.backend.service.StoryService;
import com.mangacloud.backend.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryServiceImpl implements StoryService {
    private final StoryRepository storyRepository;
    private final StoryMapper storyMapper; 

    @Override
    public StoryResponse createStory(StoryRequest request) {
        Story story = storyMapper.toEntity(request);

        story.setSlug(SlugUtil.toSlug(request.getName()));
        story.setViewCount(0);
        story.setCreatedAt(LocalDateTime.now());
        story.setUpdateAt(LocalDateTime.now());

        Story savedStory = storyRepository.save(story);
        return storyMapper.toResponse(savedStory);
    }

    @Override
    public StoryResponse getStoryBySlug(String slug) {
        Story story = storyRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy truyện với slug: " + slug));

        story.setViewCount(story.getViewCount() + 1);
        storyRepository.save(story);

        return storyMapper.toResponse(story);
    }

    @Override
    public List<StoryResponse> getAllStories() {
        List<Story> stories = storyRepository.findAll();
        return storyMapper.toResponseList(stories);
    }

    @Override
    public StoryResponse updateStory(String id, StoryRequest request) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy truyện với id: " + id));

        story.setName(request.getName());
        story.setSlug(SlugUtil.toSlug(request.getName()));
        story.setOriginName(request.getOriginName());
        story.setThumbUrl(request.getThumbUrl());
        story.setAuthor(request.getAuthor());
        story.setCategories(request.getCategories());
        story.setStatus(request.getStatus());
        story.setSummary(request.getSummary());
        story.setPublic(request.isPublic());
        story.setUpdateAt(LocalDateTime.now());

        Story updatedStory = storyRepository.save(story);
        return storyMapper.toResponse(updatedStory);
    }

    @Override
    public void deleteStory(String id) {
        if (!storyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy truyện để xóa với id: " + id);
        }
        storyRepository.deleteById(id);
    }
}
