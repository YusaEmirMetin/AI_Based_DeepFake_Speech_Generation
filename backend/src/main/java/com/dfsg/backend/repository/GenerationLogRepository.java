package com.dfsg.backend.repository;

import com.dfsg.backend.model.GenerationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GenerationLogRepository extends JpaRepository<GenerationLog, Long> {
    List<GenerationLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}
