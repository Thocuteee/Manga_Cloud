package com.mangacloud.backend.repository;

import com.mangacloud.backend.model.UserActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {
    Optional<UserActivity> findByUserId(String userId);

    boolean existsByUserId(String userId);
}