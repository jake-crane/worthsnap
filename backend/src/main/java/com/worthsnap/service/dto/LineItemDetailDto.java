package com.worthsnap.service.dto;

import java.math.BigDecimal;

public record LineItemDetailDto(
        String description,
        BigDecimal amount,
        BigDecimal previousAmount,
        BigDecimal change,
        Double percentChange) {}
