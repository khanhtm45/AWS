package com.server.service;

import com.server.entity.Product;
import com.server.entity.Review;
import com.server.repository.ProductRepository;
import com.server.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    public Review submit(Review review) { return reviewRepository.save(review); }
    public Page<Review> listByProduct(Long productId, Pageable pageable) {
        Product p = productRepository.findById(productId).orElseThrow();
        return reviewRepository.findByProduct(p, pageable);
    }
    public Review approve(Long id, boolean approved) {
        Review r = reviewRepository.findById(id).orElseThrow();
        r.setIsApproved(approved);
        return reviewRepository.save(r);
    }
}


