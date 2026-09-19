package com.worthsnap.service.repository;

import com.worthsnap.service.entity.Item;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByOrderByNameAsc();
}
