package com.server.controller;

import com.server.entity.Review;
import com.server.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/catalog/reviews")
    public Page<Review> listReviews(@RequestParam Long productId,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewService.listByProduct(productId, pageable);
    }

    @PostMapping("/catalog/reviews")
    public Review submit(@RequestBody Review review) { return reviewService.submit(review); }

    @PutMapping("/admin/reviews/{id}")
    public Review approve(@PathVariable Long id, @RequestParam boolean approved) { return reviewService.approve(id, approved); }
}


