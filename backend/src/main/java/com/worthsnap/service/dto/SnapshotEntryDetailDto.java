package com.worthsnap.service.dto;

import com.worthsnap.service.entity.CategoryType;
import java.math.BigDecimal;

public record SnapshotEntryDetailDto(
        Long itemId,
        String itemName,
        String categoryName,
        CategoryType type,
        BigDecimal value,
        BigDecimal previousValue,
        BigDecimal change,
        Double percentChange) {}
