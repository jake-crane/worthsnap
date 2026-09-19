package com.worthsnap.service.controller;

import com.worthsnap.service.dto.CategoryDto;
import com.worthsnap.service.dto.CreateCategoryRequest;
import com.worthsnap.service.entity.Category;
import com.worthsnap.service.repository.CategoryRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<CategoryDto> list() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(CategoryDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CreateCategoryRequest request) {
        Category category = new Category();
        category.setName(request.name());
        category.setType(request.type());
        return CategoryDto.from(categoryRepository.save(category));
    }
}
