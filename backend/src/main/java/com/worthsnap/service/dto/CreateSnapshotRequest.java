package com.worthsnap.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record CreateSnapshotRequest(
        @NotNull LocalDate snapshotDate,
        String notes,
        @NotEmpty List<@Valid CreateSnapshotEntryRequest> entries) {}
