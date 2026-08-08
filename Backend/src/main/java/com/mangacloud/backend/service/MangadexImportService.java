package com.mangacloud.backend.service;

import com.mangacloud.backend.model.Story;
import java.util.List;
import java.util.Map;

public interface MangadexImportService {
    List<Map<String, Object>> searchMangadexStories(String keyword);
    Story importStoryFromMangadex(String mangadexId) throws Exception;
}
