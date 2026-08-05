package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.response.UserActivityResponse;
import com.mangacloud.backend.model.UserActivity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserActivityMapper {
    public UserActivityResponse toResponse(UserActivity activity) {
        if (activity == null) return null;

        List<UserActivityResponse.HistoryResponse> historyResponses = activity.getHistory() == null 
            ? Collections.emptyList() 
            : activity.getHistory().stream()
                .map(item -> new UserActivityResponse.HistoryResponse(
                        item.getStorySlug(),
                        item.getLastChapterName(),
                        item.getReadAt()
                ))
                .collect(Collectors.toList());

        return UserActivityResponse.builder()
                .id(activity.getId())
                .userId(activity.getUserId())
                .bookmarks(activity.getBookmarks() != null ? activity.getBookmarks() : Collections.emptyList())
                .history(historyResponses)
                .build();
    }
}
