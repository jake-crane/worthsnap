package com.worthsnap.service.dto;

import com.worthsnap.service.entity.Category;
import com.worthsnap.service.entity.CategoryType;

public record CategoryDto(Long id, String name, CategoryType type) {
    public static CategoryDto from(Category category) {
        return new CategoryDto(category.getId(), category.getName(), category.getType());
    }
}
