package com.leafshop.controller;

import com.leafshop.model.dynamodb.BlogTable;
import com.leafshop.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class BlogController {

    private final BlogRepository blogRepository;

    @GetMapping
    public List<BlogTable> getAllPublished() {
        return blogRepository.findByStatus("PUBLISHED");
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        long published = blogRepository.findByStatus("PUBLISHED").size();
        long draft = blogRepository.findByStatus("DRAFT").size();
        long scheduled = blogRepository.findByStatus("SCHEDULED").size();
        long hidden = blogRepository.findByStatus("HIDDEN").size();
        long total = published + draft + scheduled + hidden;
        stats.put("total", total);
        stats.put("published", published);
        stats.put("draft", draft);
        stats.put("scheduled", scheduled);
        stats.put("hidden", hidden);
        return ResponseEntity.ok(stats);
    }

    @PostMapping
    public BlogTable createPost(@RequestBody BlogTable post) {
        blogRepository.save(post);
        return post;
    }
}
