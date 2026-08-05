package com.mangacloud.backend.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryRequest {
    private String name;
    private String slug;
    private List<String> originName;
    private String thumbUrl;
    private String author;
    private List<String> categories;
    private String status;
    private String sumary;
    private boolean isPublic;
}