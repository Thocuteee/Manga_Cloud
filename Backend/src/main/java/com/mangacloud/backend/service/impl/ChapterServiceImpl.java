package com.mangacloud.backend.service.impl;

import com.mangacloud.backend.dtos.request.ChapterRequest;
import com.mangacloud.backend.dtos.response.ChapterResponse;
import com.mangacloud.backend.exception.ResourceNotFoundException;
import com.mangacloud.backend.mapper.ChapterMapper;
import com.mangacloud.backend.model.Chapter;
import com.mangacloud.backend.repository.ChapterRepository;
import com.mangacloud.backend.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChapterServiceImpl implements ChapterService{
    private final ChapterRepository chapterRepository;
    private final ChapterMapper chapterMapper;

    @Override
    public ChapterResponse createChapter(ChapterRequest request) {
        Chapter chapter = chapterMapper.toEntity(request);
        chapter.setUpdatedAt(LocalDateTime.now());

        Chapter savedChapter = chapterRepository.save(chapter);

        return chapterMapper.toResponse(savedChapter);
    }

    @Override
    public List<ChapterResponse> getChaptersByStorySlug(String storySlug) {
        List<Chapter> chapters = chapterRepository.findByStorySlug(storySlug);
        
        return chapterMapper.toResponseList(chapters);
    }

    @Override
    public ChapterResponse getChapterDetail(String storySlug, String chapterName) {
        Chapter chapter = chapterRepository.findByStorySlugAndChapterName(storySlug, chapterName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy chương " + chapterName + " của truyện: " + storySlug));

        return chapterMapper.toResponse(chapter);
    }

    @Override
    public ChapterResponse updateChapter(String id, ChapterRequest request) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương với id: " + id));

        chapter.setStorySlug(request.getStorySlug());
        chapter.setChapterName(request.getChapterName());
        chapter.setChapterTitle(request.getChapterTitle());
        chapter.setChapterApiUrl(request.getChapterApiUrl());
        if (request.getPages() != null) {
            chapter.setPages(request.getPages());
        }
        chapter.setUpdatedAt(LocalDateTime.now());

        Chapter updatedChapter = chapterRepository.save(chapter);
        return chapterMapper.toResponse(updatedChapter);
    }

    @Override
    public void deleteChapter(String id) {
        if (!chapterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chương để xóa với id: " + id);
        }
        chapterRepository.deleteById(id);
    }
}
