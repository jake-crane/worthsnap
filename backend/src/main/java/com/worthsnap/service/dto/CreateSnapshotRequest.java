package com.worthsnap.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public record CreateSnapshotRequest(
        @NotNull LocalDateTime snapshotDate,
        String notes,
        @NotEmpty List<@Valid CreateLineItemRequest> lineItems) {}
