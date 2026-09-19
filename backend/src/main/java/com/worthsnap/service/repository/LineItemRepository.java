package com.worthsnap.service.repository;

import com.worthsnap.service.entity.LineItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LineItemRepository extends JpaRepository<LineItem, Long> {
    List<LineItem> findBySnapshotId(Long snapshotId);

    @Query(
            "select distinct l.description from LineItem l where l.snapshot.userId = :userId order by l.description asc")
    List<String> findDistinctDescriptionsByUserId(Long userId);
}
