package com.worthsnap.service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NetWorthPointDto(Long snapshotId, LocalDate snapshotDate, BigDecimal netWorth) {}
