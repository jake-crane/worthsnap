package com.worthsnap.service.repository;

import com.worthsnap.service.entity.Snapshot;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnapshotRepository extends JpaRepository<Snapshot, Long> {
    List<Snapshot> findAllByUserIdOrderBySnapshotDateAsc(Long userId);

    Optional<Snapshot> findByIdAndUserId(Long id, Long userId);

    Optional<Snapshot> findFirstByUserIdAndSnapshotDateLessThanOrderBySnapshotDateDesc(
            Long userId, LocalDateTime snapshotDate);
}
