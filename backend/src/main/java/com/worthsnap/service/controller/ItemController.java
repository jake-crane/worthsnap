package com.worthsnap.service.controller;

import com.worthsnap.service.dto.CreateItemRequest;
import com.worthsnap.service.dto.ItemDto;
import com.worthsnap.service.dto.UpdateItemRequest;
import com.worthsnap.service.entity.Category;
import com.worthsnap.service.entity.Item;
import com.worthsnap.service.repository.CategoryRepository;
import com.worthsnap.service.repository.ItemRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/items")
@Transactional
public class ItemController {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;

    public ItemController(ItemRepository itemRepository, CategoryRepository categoryRepository) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<ItemDto> list() {
        return itemRepository.findAllByOrderByNameAsc().stream().map(ItemDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemDto create(@Valid @RequestBody CreateItemRequest request) {
        Category category = categoryRepository
                .findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        Item item = new Item();
        item.setName(request.name());
        item.setCategory(category);
        return ItemDto.from(itemRepository.save(item));
    }

    @PatchMapping("/{id}")
    public ItemDto update(@PathVariable Long id, @Valid @RequestBody UpdateItemRequest request) {
        Item item = itemRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        item.setArchived(request.archived());
        return ItemDto.from(itemRepository.save(item));
    }
}
