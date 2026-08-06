package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.response.UserActivityResponse;
import com.mangacloud.backend.model.UserActivity;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserActivityMapper {
    UserActivityResponse toResponse(UserActivity activity);

    UserActivityResponse.HistoryResponseItem toHistoryResponseItem(UserActivity.HistoryItem item);
}