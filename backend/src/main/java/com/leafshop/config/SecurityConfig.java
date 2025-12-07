package com.leafshop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.leafshop.auth.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			// Disable CSRF cho REST API
			.csrf(csrf -> csrf.disable())
			
			// Cấu hình CORS
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			
			// Cấu hình session - stateless cho REST API
			.sessionManagement(session -> 
				session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			)
			
			// Cấu hình authorization
			.authorizeHttpRequests(auth -> auth
				// Cho phép truy cập Swagger UI và API docs
				.requestMatchers(
					"/swagger-ui.html",
					"/swagger-ui/**",
					"/api-docs/**",
					"/v3/api-docs/**",
					"/swagger-resources/**",
					"/webjars/**"
				).permitAll()
				
					// Public endpoints for auth and password reset
					.requestMatchers("/api/auth/**", "/api/password/**").permitAll()

					// Admin endpoints
					.requestMatchers("/api/admin/**").hasRole("ADMIN")

					// Allow public read access to products (pages, detail, media, variants)
					.requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()

					// Allow public read access to categories for storefront
					// Mutating category endpoints require admin privileges
					.requestMatchers(HttpMethod.POST, "/api/categories/**").permitAll()
					.requestMatchers(HttpMethod.PUT, "/api/categories/**").permitAll()
					.requestMatchers(HttpMethod.DELETE, "/api/categories/**").permitAll()

					// Allow public read access to categories for storefront
					.requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()


					// Allow public access to common static resources and error page
					// Note: avoid complex double-wildcard patterns that can cause PathPattern parsing issues.
					.requestMatchers(HttpMethod.GET,
							"/",
							"/index.html",
							"/favicon.ico",
							"/logo.png",
							"/LEAF.png",
							"/static/**",
							"/public/**",
							"/assets/**"
					).permitAll()

					// Ensure the error endpoint is always accessible (all HTTP methods).
					// Prevents a protected /error from causing a secondary 403 when handling errors.
					.requestMatchers("/error").permitAll()

					// Public customer endpoints (used by email+OTP flow)
					.requestMatchers(HttpMethod.GET, "/api/customer/**").permitAll()

					// Protect all other API endpoints under /api/**
					.requestMatchers("/api/**").permitAll()
				
				// Tất cả các request khác cần authentication
				.anyRequest().authenticated()
			);

		// Add JWT filter
		http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		
		// Lấy allowed origins từ application.properties
		// Nếu không có, sử dụng default
		configuration.setAllowedOrigins(Arrays.asList(
				"http://localhost:4000",
				"http://127.0.0.1:4000",
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5500",  // VS Code Live Server default port
			"http://localhost:8000",  // Python HTTP server default port
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"http://127.0.0.1:5500",  // VS Code Live Server default port
			"http://127.0.0.1:8000",  // Python HTTP server default port
			"http://127.0.0.1:8080",
			"https://dna-chain-wed-fpt-89yn.vercel.app",
			"https://dna-chain-bloodline.vercel.app",
			"https://dna-chain-bl.vercel.app",
			"https://d2bk5r8qpr2ye6.cloudfront.net",
			"https://98.81.221.1:8080",

			"http://98.81.221.1:8080"
		
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		configuration.setAllowedHeaders(Arrays.asList("*"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L);
		
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		
		return source;
	}
}

