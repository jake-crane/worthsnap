package com.worthsnap.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SnapshotDetailDto(
        Long id,
        LocalDateTime snapshotDate,
        String notes,
        BigDecimal netWorth,
        BigDecimal previousNetWorth,
        BigDecimal netWorthChange,
        Double netWorthPercentChange,
        List<LineItemDetailDto> lineItems) {}
