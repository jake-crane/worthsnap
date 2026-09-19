package com.worthsnap.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SnapshotSummaryDto(Long id, LocalDateTime snapshotDate, String notes, BigDecimal netWorth) {}
