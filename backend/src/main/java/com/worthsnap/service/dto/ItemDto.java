package com.worthsnap.service.dto;

import com.worthsnap.service.entity.CategoryType;
import com.worthsnap.service.entity.Item;

public record ItemDto(
        Long id, String name, Long categoryId, String categoryName, CategoryType type, boolean archived) {
    public static ItemDto from(Item item) {
        return new ItemDto(
                item.getId(),
                item.getName(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getCategory().getType(),
                item.isArchived());
    }
}
