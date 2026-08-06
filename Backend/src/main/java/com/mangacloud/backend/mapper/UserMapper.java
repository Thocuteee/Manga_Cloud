package com.mangacloud.backend.mapper;

import com.mangacloud.backend.dtos.request.RegisterRequest;
import com.mangacloud.backend.dtos.response.AuthResponse;
import com.mangacloud.backend.dtos.response.UserResponse;
import com.mangacloud.backend.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    UserResponse toUserResponse(User user);

    AuthResponse toAuthResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", source = "encodedPassword")
    User toEntity(RegisterRequest req, String encodedPassword);
}
