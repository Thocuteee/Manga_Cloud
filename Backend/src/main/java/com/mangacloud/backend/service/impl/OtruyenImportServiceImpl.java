package com.mangacloud.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangacloud.backend.model.Chapter;
import com.mangacloud.backend.model.Story;
import com.mangacloud.backend.repository.ChapterRepository;
import com.mangacloud.backend.repository.StoryRepository;
import com.mangacloud.backend.service.OtruyenImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OtruyenImportServiceImpl implements OtruyenImportService {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${otruyen.cdn.url:https://otruyenapi.com/uploads/comics/}")
    private String otruyenCdnUrl;

    @Value("${otruyen.api.base-url:https://otruyenapi.com/v1/api/}")
    private String otruyenApiBaseUrl;

    @Override
    public String formatThumbUrl(String thumbFile) {
        if (thumbFile == null || thumbFile.isEmpty()) {
            return "";
        }
        return thumbFile.startsWith("http") ? thumbFile : otruyenCdnUrl + thumbFile;
    }

    private String fetchJson(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Lỗi khi fetch URL: " + url + " - " + e.getMessage());
            return null;
        }
    }

    @Override
    public Story importStoryBySlug(String slug) throws Exception {
        return importStoryInternal(slug);
    }

    @Async
    @Override
    public void importBatchStoriesAsync(int pages) {
        int totalStoriesImported = 0;
        int maxPages = Math.min(pages, 10);

        for (int page = 1; page <= maxPages; page++) {
            String catalogUrl = otruyenApiBaseUrl + "danh-sach/truyen-moi?page=" + page;
            String catalogJson = fetchJson(catalogUrl);
            if (catalogJson != null) {
                try {
                    JsonNode root = objectMapper.readTree(catalogJson);
                    JsonNode items = root.path("data").path("items");
                    if (items.isArray()) {
                        for (JsonNode item : items) {
                            String slug = item.path("slug").asText();
                            if (!slug.isEmpty()) {
                                try {
                                    String name = item.path("name").asText("Truyện Otruyen");
                                    String rawStatus = item.path("status").asText();
                                    String status = "completed".equalsIgnoreCase(rawStatus) ? "Completed" : ("coming_soon".equalsIgnoreCase(rawStatus) ? "Upcoming" : "Ongoing");
                                    String thumbFile = item.path("thumb_url").asText();
                                    String thumbUrl = formatThumbUrl(thumbFile);

                                    List<String> categories = new ArrayList<>();
                                    if (item.path("category").isArray()) {
                                        for (JsonNode catNode : item.path("category")) {
                                            categories.add(catNode.path("name").asText());
                                        }
                                    }
                                    if (categories.isEmpty()) categories.add("Manga");

                                    // Extract latest chapter and total chapters from catalog item
                                    JsonNode chaptersLatestNode = item.path("chaptersLatest");
                                    String latestChNum = "1";
                                    if (chaptersLatestNode.isArray() && chaptersLatestNode.size() > 0) {
                                        latestChNum = chaptersLatestNode.get(0).path("chapter_name").asText("1");
                                    }

                                    int totalChCount = 1;
                                    try {
                                        totalChCount = (int) Math.round(Double.parseDouble(latestChNum.replaceAll("[^0-9.]", "")));
                                    } catch (Exception e) {
                                        totalChCount = 1;
                                    }

                                    Optional<Story> existingStoryOpt = storyRepository.findBySlug(slug);
                                    Story storyEntity = existingStoryOpt.orElseGet(() -> Story.builder()
                                            .slug(slug)
                                            .viewCount(100000L + new Random().nextInt(500000))
                                            .createdAt(LocalDateTime.now())
                                            .isPublic(true)
                                            .build());

                                    storyEntity.setName(name);
                                    storyEntity.setAuthor("MangaCloud");
                                    storyEntity.setSummary("Bộ truyện " + name + " được cập nhật tự động từ Otruyen.");
                                    storyEntity.setCategories(categories);
                                    storyEntity.setStatus(status);
                                    storyEntity.setThumbUrl(thumbUrl);
                                    storyEntity.setLatestChapter("Ch. " + latestChNum);
                                    storyEntity.setTotalChapters(totalChCount);
                                    storyEntity.setUpdateAt(LocalDateTime.now());

                                    storyRepository.save(storyEntity);
                                    totalStoriesImported++;

                                } catch (Exception e) {
                                    System.err.println("Lỗi cào batch item " + slug + ": " + e.getMessage());
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi parse JSON catalog page " + page + ": " + e.getMessage());
                }
            }
        }
    }

    private Story importStoryInternal(String slug) throws Exception {
        String url = otruyenApiBaseUrl + "truyen-tranh/" + slug;
        String jsonResponse = fetchJson(url);
        if (jsonResponse == null) return null;

        JsonNode rootNode = objectMapper.readTree(jsonResponse);
        JsonNode itemNode = rootNode.path("data").path("item");

        if (itemNode.isMissingNode()) return null;

        String name = itemNode.path("name").asText("Truyện Otruyen");
        String storySlug = itemNode.path("slug").asText(slug);
        String summary = itemNode.path("content").asText("Tóm tắt nội dung chưa cập nhật.").replaceAll("<[^>]*>", "");
        String rawStatus = itemNode.path("status").asText();
        String status = "completed".equalsIgnoreCase(rawStatus) ? "Completed" : ("coming_soon".equalsIgnoreCase(rawStatus) ? "Upcoming" : "Ongoing");

        String author = "MangaCloud";
        if (itemNode.path("author").isArray() && itemNode.path("author").size() > 0) {
            author = itemNode.path("author").get(0).asText();
        }

        List<String> categories = new ArrayList<>();
        if (itemNode.path("category").isArray()) {
            for (JsonNode catNode : itemNode.path("category")) {
                categories.add(catNode.path("name").asText());
            }
        }
        if (categories.isEmpty()) categories.add("Manga");

        String thumbFile = itemNode.path("thumb_url").asText();
        String thumbUrl = formatThumbUrl(thumbFile);

        // Import Chapters list & find latest chapter
        JsonNode chaptersNode = itemNode.path("chapters");
        String latestChapterName = "Ch. 1";
        List<ChapterData> chapterListToImport = new ArrayList<>();

        if (chaptersNode.isArray() && chaptersNode.size() > 0) {
            JsonNode serverData = chaptersNode.get(0).path("server_data");
            if (serverData.isArray() && serverData.size() > 0) {
                int totalCh = serverData.size();
                String lastChNum = serverData.get(totalCh - 1).path("chapter_name").asText();
                latestChapterName = "Ch. " + lastChNum;

                for (int i = 0; i < totalCh; i++) {
                    JsonNode chNode = serverData.get(i);
                    String chName = chNode.path("chapter_name").asText();
                    String chTitle = chNode.path("chapter_title").asText("Chapter " + chName);
                    String chapterApiUrl = chNode.path("chapter_api_data").asText();
                    chapterListToImport.add(new ChapterData(chName, chTitle, chapterApiUrl, i < 3 || i == totalCh - 1));
                }
            }
        }

        Optional<Story> existingStoryOpt = storyRepository.findBySlug(storySlug);
        Story storyEntity = existingStoryOpt.orElseGet(() -> Story.builder()
                .slug(storySlug)
                .viewCount(100000L + new Random().nextInt(500000))
                .createdAt(LocalDateTime.now())
                .isPublic(true)
                .build());

        storyEntity.setName(name);
        storyEntity.setAuthor(author);
        storyEntity.setSummary(summary);
        storyEntity.setCategories(categories);
        storyEntity.setStatus(status);
        storyEntity.setThumbUrl(thumbUrl);
        storyEntity.setLatestChapter(latestChapterName);
        storyEntity.setTotalChapters(chapterListToImport.size());
        storyEntity.setUpdateAt(LocalDateTime.now());

        storyRepository.save(storyEntity);

        // Save Chapter records to Mongo
        for (ChapterData chData : chapterListToImport) {
            try {
                List<String> pageUrls = new ArrayList<>();
                if (chData.shouldFetchPages && !chData.chapterApiUrl.isEmpty()) {
                    String chJsonResponse = fetchJson(chData.chapterApiUrl);
                    if (chJsonResponse != null) {
                        JsonNode chRootNode = objectMapper.readTree(chJsonResponse);
                        JsonNode chItemNode = chRootNode.path("data").path("item");
                        String domainCdn = chRootNode.path("data").path("domain_cdn").asText("https://sv1.otruyencdn.com");
                        String chapterPath = chItemNode.path("chapter_path").asText();

                        JsonNode imagesNode = chItemNode.path("chapter_image");
                        if (imagesNode.isArray()) {
                            for (JsonNode imgNode : imagesNode) {
                                String imgFile = imgNode.path("image_file").asText();
                                if (!imgFile.isEmpty()) {
                                    pageUrls.add(domainCdn + "/" + chapterPath + "/" + imgFile);
                                }
                            }
                        }
                    }
                }

                Optional<Chapter> existingCh = chapterRepository.findByStorySlugAndChapterName(storySlug, chData.chName);
                Chapter chapterEntity = existingCh.orElseGet(() -> Chapter.builder()
                        .storySlug(storySlug)
                        .chapterName(chData.chName)
                        .updatedAt(LocalDateTime.now())
                        .build());

                chapterEntity.setChapterTitle(chData.chTitle);
                chapterEntity.setChapterApiUrl(chData.chapterApiUrl);
                if (!pageUrls.isEmpty()) {
                    chapterEntity.setPages(pageUrls);
                }
                chapterRepository.save(chapterEntity);
            } catch (Exception e) {
                System.err.println("Lỗi khi lưu chapter " + chData.chName + " cho slug " + storySlug + ": " + e.getMessage());
            }
        }

        return storyEntity;
    }

    private static class ChapterData {
        String chName;
        String chTitle;
        String chapterApiUrl;
        boolean shouldFetchPages;

        public ChapterData(String chName, String chTitle, String chapterApiUrl, boolean shouldFetchPages) {
            this.chName = chName;
            this.chTitle = chTitle;
            this.chapterApiUrl = chapterApiUrl;
            this.shouldFetchPages = shouldFetchPages;
        }
    }
}
