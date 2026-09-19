package com.worthsnap.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateItemRequest(@NotBlank String name, @NotNull Long categoryId) {}
