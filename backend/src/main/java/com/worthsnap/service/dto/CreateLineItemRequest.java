package com.worthsnap.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateLineItemRequest(@NotBlank String description, @NotNull BigDecimal amount) {}
