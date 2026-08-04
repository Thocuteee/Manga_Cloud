package com.mangacloud.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stories")
public class Story {
    @Id
    private String id;

    private String name;
    
    private String slug;

    @Field("origin_name")
    private List<String> originName;

    @Field("thumb_url")
    private String thumbUrl;

    private String author;

    private List<String> categories;

    private String status;

    private String summary; 

    @Field("view_count")
    private long viewCount;

    @Field("is_public")
    private boolean isPublic;

    @Field("update_at")
    private LocalDateTime updateAt;
}
