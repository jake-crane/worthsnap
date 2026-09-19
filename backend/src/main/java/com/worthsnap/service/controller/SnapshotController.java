package com.worthsnap.service.controller;

import com.worthsnap.service.dto.CreateSnapshotRequest;
import com.worthsnap.service.dto.NetWorthPointDto;
import com.worthsnap.service.dto.SnapshotDetailDto;
import com.worthsnap.service.dto.SnapshotSummaryDto;
import com.worthsnap.service.security.AppPrincipal;
import com.worthsnap.service.service.SnapshotService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SnapshotController {

    private final SnapshotService snapshotService;

    public SnapshotController(SnapshotService snapshotService) {
        this.snapshotService = snapshotService;
    }

    @GetMapping("/snapshots")
    public List<SnapshotSummaryDto> list(@AuthenticationPrincipal AppPrincipal principal) {
        return snapshotService.listSummaries(principal.getUserId());
    }

    @PostMapping("/snapshots")
    @ResponseStatus(HttpStatus.CREATED)
    public SnapshotDetailDto create(
            @AuthenticationPrincipal AppPrincipal principal, @Valid @RequestBody CreateSnapshotRequest request) {
        return snapshotService.create(principal.getUserId(), request);
    }

    @GetMapping("/snapshots/{id}")
    public SnapshotDetailDto detail(@AuthenticationPrincipal AppPrincipal principal, @PathVariable Long id) {
        return snapshotService.getDetail(principal.getUserId(), id);
    }

    @DeleteMapping("/snapshots/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppPrincipal principal, @PathVariable Long id) {
        snapshotService.delete(principal.getUserId(), id);
    }

    @GetMapping("/net-worth-history")
    public List<NetWorthPointDto> netWorthHistory(@AuthenticationPrincipal AppPrincipal principal) {
        return snapshotService.netWorthHistory(principal.getUserId());
    }

    @GetMapping("/descriptions")
    public List<String> descriptions(@AuthenticationPrincipal AppPrincipal principal) {
        return snapshotService.listDescriptions(principal.getUserId());
    }
}
