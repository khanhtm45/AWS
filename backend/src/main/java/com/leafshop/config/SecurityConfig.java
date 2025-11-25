package com.leafshop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
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

					// Protect all other API endpoints under /api/**
					.requestMatchers("/api/**").authenticated()
				
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
			"https://dna-chain-bl.vercel.app"
		));
		
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		configuration.setAllowedHeaders(Arrays.asList("*"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L);
		
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		
		return source;
	}
}

