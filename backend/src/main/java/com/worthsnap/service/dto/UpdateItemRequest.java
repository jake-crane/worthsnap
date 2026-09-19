package com.worthsnap.service.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateItemRequest(@NotNull Boolean archived) {}
