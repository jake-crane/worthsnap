package com.worthsnap.service.repository;

import com.worthsnap.service.entity.Snapshot;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnapshotRepository extends JpaRepository<Snapshot, Long> {
    List<Snapshot> findAllByOrderBySnapshotDateAsc();

    Optional<Snapshot> findFirstBySnapshotDateLessThanOrderBySnapshotDateDesc(LocalDate snapshotDate);

    boolean existsBySnapshotDate(LocalDate snapshotDate);
}
