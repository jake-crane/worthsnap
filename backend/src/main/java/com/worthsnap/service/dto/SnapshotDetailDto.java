package com.worthsnap.service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SnapshotDetailDto(
        Long id,
        LocalDate snapshotDate,
        String notes,
        BigDecimal netWorth,
        BigDecimal previousNetWorth,
        BigDecimal netWorthChange,
        Double netWorthPercentChange,
        List<SnapshotEntryDetailDto> entries) {}
