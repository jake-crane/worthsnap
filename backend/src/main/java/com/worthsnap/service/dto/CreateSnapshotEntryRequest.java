package com.worthsnap.service.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateSnapshotEntryRequest(@NotNull Long itemId, @NotNull BigDecimal value) {}
