package com.worthsnap.service.controller;

import com.worthsnap.service.dto.CreateSnapshotRequest;
import com.worthsnap.service.dto.NetWorthPointDto;
import com.worthsnap.service.dto.SnapshotDetailDto;
import com.worthsnap.service.dto.SnapshotSummaryDto;
import com.worthsnap.service.service.SnapshotService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SnapshotController {

    private final SnapshotService snapshotService;

    public SnapshotController(SnapshotService snapshotService) {
        this.snapshotService = snapshotService;
    }

    @GetMapping("/snapshots")
    public List<SnapshotSummaryDto> list() {
        return snapshotService.listSummaries();
    }

    @PostMapping("/snapshots")
    @ResponseStatus(HttpStatus.CREATED)
    public SnapshotDetailDto create(@Valid @RequestBody CreateSnapshotRequest request) {
        return snapshotService.create(request);
    }

    @GetMapping("/snapshots/{id}")
    public SnapshotDetailDto detail(@PathVariable Long id) {
        return snapshotService.getDetail(id);
    }

    @GetMapping("/net-worth-history")
    public List<NetWorthPointDto> netWorthHistory() {
        return snapshotService.netWorthHistory();
    }
}
