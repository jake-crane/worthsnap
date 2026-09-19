package com.worthsnap.service.dto;

import com.worthsnap.service.entity.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCategoryRequest(@NotBlank String name, @NotNull CategoryType type) {}
