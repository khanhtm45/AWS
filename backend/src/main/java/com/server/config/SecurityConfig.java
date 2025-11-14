package com.server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

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
				
				// Cho phép truy cập các endpoint API (tạm thời permitAll)
				// Có thể thêm JWT authentication sau
				.requestMatchers("/api/**").permitAll()
				
				// Tất cả các request khác cần authentication
				.anyRequest().authenticated()
			);

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		
		// Lấy allowed origins từ application.properties
		// Nếu không có, sử dụng default
		configuration.setAllowedOrigins(Arrays.asList(
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
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

