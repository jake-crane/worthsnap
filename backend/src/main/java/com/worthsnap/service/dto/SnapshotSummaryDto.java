package com.worthsnap.service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SnapshotSummaryDto(Long id, LocalDate snapshotDate, String notes, BigDecimal netWorth) {}
