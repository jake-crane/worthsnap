package com.worthsnap.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record NetWorthPointDto(Long snapshotId, LocalDateTime snapshotDate, BigDecimal netWorth) {}
