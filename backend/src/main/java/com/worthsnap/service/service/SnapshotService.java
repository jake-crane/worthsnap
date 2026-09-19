package com.worthsnap.service.service;

import com.worthsnap.service.dto.CreateSnapshotRequest;
import com.worthsnap.service.dto.LineItemDetailDto;
import com.worthsnap.service.dto.NetWorthPointDto;
import com.worthsnap.service.dto.SnapshotDetailDto;
import com.worthsnap.service.dto.SnapshotSummaryDto;
import com.worthsnap.service.entity.LineItem;
import com.worthsnap.service.entity.Snapshot;
import com.worthsnap.service.repository.LineItemRepository;
import com.worthsnap.service.repository.SnapshotRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class SnapshotService {

    private final SnapshotRepository snapshotRepository;
    private final LineItemRepository lineItemRepository;

    public SnapshotService(SnapshotRepository snapshotRepository, LineItemRepository lineItemRepository) {
        this.snapshotRepository = snapshotRepository;
        this.lineItemRepository = lineItemRepository;
    }

    @Transactional(readOnly = true)
    public List<SnapshotSummaryDto> listSummaries(Long userId) {
        return snapshotRepository.findAllByUserIdOrderBySnapshotDateAsc(userId).stream()
                .map(s -> new SnapshotSummaryDto(
                        s.getId(), s.getSnapshotDate(), s.getNotes(), netWorthOf(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NetWorthPointDto> netWorthHistory(Long userId) {
        return snapshotRepository.findAllByUserIdOrderBySnapshotDateAsc(userId).stream()
                .map(s -> new NetWorthPointDto(s.getId(), s.getSnapshotDate(), netWorthOf(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listDescriptions(Long userId) {
        return lineItemRepository.findDistinctDescriptionsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public SnapshotDetailDto getDetail(Long userId, Long id) {
        Snapshot snapshot = snapshotRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Snapshot not found"));
        return toDetailDto(userId, snapshot);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Snapshot snapshot = snapshotRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Snapshot not found"));
        snapshotRepository.delete(snapshot);
    }

    @Transactional
    public SnapshotDetailDto create(Long userId, CreateSnapshotRequest request) {
        Set<String> seenDescriptions = new HashSet<>();
        for (var lineItemRequest : request.lineItems()) {
            String key = lineItemRequest.description().trim().toLowerCase();
            if (!seenDescriptions.add(key)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate line item description: " + lineItemRequest.description());
            }
        }

        Snapshot snapshot = new Snapshot();
        snapshot.setUserId(userId);
        snapshot.setSnapshotDate(request.snapshotDate());
        snapshot.setNotes(request.notes());
        snapshot = snapshotRepository.save(snapshot);

        for (var lineItemRequest : request.lineItems()) {
            LineItem lineItem = new LineItem();
            lineItem.setSnapshot(snapshot);
            lineItem.setDescription(lineItemRequest.description());
            lineItem.setAmount(lineItemRequest.amount());
            lineItemRepository.save(lineItem);
        }

        return toDetailDto(userId, snapshot);
    }

    private SnapshotDetailDto toDetailDto(Long userId, Snapshot snapshot) {
        List<LineItem> lineItems = lineItemRepository.findBySnapshotId(snapshot.getId());

        Snapshot previousSnapshot = snapshotRepository
                .findFirstByUserIdAndSnapshotDateLessThanOrderBySnapshotDateDesc(userId, snapshot.getSnapshotDate())
                .orElse(null);
        Map<String, BigDecimal> previousAmountsByDescription = previousSnapshot == null
                ? Map.of()
                : lineItemRepository.findBySnapshotId(previousSnapshot.getId()).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                LineItem::getDescription, LineItem::getAmount, (a, b) -> a));

        List<LineItemDetailDto> lineItemDtos = lineItems.stream()
                .sorted(Comparator.comparing(LineItem::getDescription))
                .map(li -> {
                    BigDecimal previousAmount = previousAmountsByDescription.get(li.getDescription());
                    return new LineItemDetailDto(
                            li.getDescription(),
                            li.getAmount(),
                            previousAmount,
                            change(li.getAmount(), previousAmount),
                            percentChange(li.getAmount(), previousAmount));
                })
                .toList();

        BigDecimal netWorth = sumNetWorth(lineItems);
        BigDecimal previousNetWorth = previousSnapshot == null
                ? null
                : sumNetWorth(lineItemRepository.findBySnapshotId(previousSnapshot.getId()));

        return new SnapshotDetailDto(
                snapshot.getId(),
                snapshot.getSnapshotDate(),
                snapshot.getNotes(),
                netWorth,
                previousNetWorth,
                change(netWorth, previousNetWorth),
                percentChange(netWorth, previousNetWorth),
                lineItemDtos);
    }

    private BigDecimal netWorthOf(Long snapshotId) {
        return sumNetWorth(lineItemRepository.findBySnapshotId(snapshotId));
    }

    private BigDecimal sumNetWorth(List<LineItem> lineItems) {
        BigDecimal total = BigDecimal.ZERO;
        for (LineItem lineItem : lineItems) {
            total = total.add(lineItem.getAmount());
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
