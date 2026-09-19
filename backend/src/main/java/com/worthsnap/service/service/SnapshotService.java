package com.worthsnap.service.service;

import com.worthsnap.service.dto.CreateSnapshotRequest;
import com.worthsnap.service.dto.NetWorthPointDto;
import com.worthsnap.service.dto.SnapshotDetailDto;
import com.worthsnap.service.dto.SnapshotEntryDetailDto;
import com.worthsnap.service.dto.SnapshotSummaryDto;
import com.worthsnap.service.entity.CategoryType;
import com.worthsnap.service.entity.Item;
import com.worthsnap.service.entity.Snapshot;
import com.worthsnap.service.entity.SnapshotEntry;
import com.worthsnap.service.repository.ItemRepository;
import com.worthsnap.service.repository.SnapshotEntryRepository;
import com.worthsnap.service.repository.SnapshotRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class SnapshotService {

    private final SnapshotRepository snapshotRepository;
    private final SnapshotEntryRepository snapshotEntryRepository;
    private final ItemRepository itemRepository;

    public SnapshotService(
            SnapshotRepository snapshotRepository,
            SnapshotEntryRepository snapshotEntryRepository,
            ItemRepository itemRepository) {
        this.snapshotRepository = snapshotRepository;
        this.snapshotEntryRepository = snapshotEntryRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public List<SnapshotSummaryDto> listSummaries() {
        return snapshotRepository.findAllByOrderBySnapshotDateAsc().stream()
                .map(s -> new SnapshotSummaryDto(
                        s.getId(), s.getSnapshotDate(), s.getNotes(), netWorthOf(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NetWorthPointDto> netWorthHistory() {
        return snapshotRepository.findAllByOrderBySnapshotDateAsc().stream()
                .map(s -> new NetWorthPointDto(s.getId(), s.getSnapshotDate(), netWorthOf(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SnapshotDetailDto getDetail(Long id) {
        Snapshot snapshot = snapshotRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Snapshot not found"));
        return toDetailDto(snapshot);
    }

    @Transactional
    public SnapshotDetailDto create(CreateSnapshotRequest request) {
        if (snapshotRepository.existsBySnapshotDate(request.snapshotDate())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "A snapshot already exists for " + request.snapshotDate());
        }

        Snapshot snapshot = new Snapshot();
        snapshot.setSnapshotDate(request.snapshotDate());
        snapshot.setNotes(request.notes());
        snapshot = snapshotRepository.save(snapshot);

        for (var entryRequest : request.entries()) {
            Item item = itemRepository
                    .findById(entryRequest.itemId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Item not found: " + entryRequest.itemId()));
            SnapshotEntry entry = new SnapshotEntry();
            entry.setSnapshot(snapshot);
            entry.setItem(item);
            entry.setValue(entryRequest.value());
            snapshotEntryRepository.save(entry);
        }

        return toDetailDto(snapshot);
    }

    private SnapshotDetailDto toDetailDto(Snapshot snapshot) {
        List<SnapshotEntry> entries = snapshotEntryRepository.findBySnapshotId(snapshot.getId());

        Snapshot previousSnapshot =
                snapshotRepository
                        .findFirstBySnapshotDateLessThanOrderBySnapshotDateDesc(snapshot.getSnapshotDate())
                        .orElse(null);
        Map<Long, BigDecimal> previousValuesByItemId = previousSnapshot == null
                ? Map.of()
                : snapshotEntryRepository.findBySnapshotId(previousSnapshot.getId()).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                e -> e.getItem().getId(), SnapshotEntry::getValue));

        List<SnapshotEntryDetailDto> entryDtos = entries.stream()
                .sorted(Comparator.comparing(e -> e.getItem().getName()))
                .map(e -> {
                    Item item = e.getItem();
                    BigDecimal previousValue = previousValuesByItemId.get(item.getId());
                    return new SnapshotEntryDetailDto(
                            item.getId(),
                            item.getName(),
                            item.getCategory().getName(),
                            item.getCategory().getType(),
                            e.getValue(),
                            previousValue,
                            change(e.getValue(), previousValue),
                            percentChange(e.getValue(), previousValue));
                })
                .toList();

        BigDecimal netWorth = sumNetWorth(entries);
        BigDecimal previousNetWorth = previousSnapshot == null
                ? null
                : sumNetWorth(snapshotEntryRepository.findBySnapshotId(previousSnapshot.getId()));

        return new SnapshotDetailDto(
                snapshot.getId(),
                snapshot.getSnapshotDate(),
                snapshot.getNotes(),
                netWorth,
                previousNetWorth,
                change(netWorth, previousNetWorth),
                percentChange(netWorth, previousNetWorth),
                entryDtos);
    }

    private BigDecimal netWorthOf(Long snapshotId) {
        return sumNetWorth(snapshotEntryRepository.findBySnapshotId(snapshotId));
    }

    private BigDecimal sumNetWorth(List<SnapshotEntry> entries) {
        BigDecimal total = BigDecimal.ZERO;
        for (SnapshotEntry entry : entries) {
            BigDecimal signedValue = entry.getItem().getCategory().getType() == CategoryType.LIABILITY
                    ? entry.getValue().negate()
                    : entry.getValue();
            total = total.add(signedValue);
        }
        return total;
    }

    private BigDecimal change(BigDecimal current, BigDecimal previous) {
        return previous == null ? null : current.subtract(previous);
    }

    private Double percentChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous.abs(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}
