package com.worthsnap.service.repository;

import com.worthsnap.service.entity.SnapshotEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnapshotEntryRepository extends JpaRepository<SnapshotEntry, Long> {
    List<SnapshotEntry> findBySnapshotId(Long snapshotId);
}
