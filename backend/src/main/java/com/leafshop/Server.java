package com.leafshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;

import com.leafshop.config.AppProperties;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;
import java.util.Set;

@SpringBootApplication
@EnableCaching
@EnableConfigurationProperties({AppProperties.class})
public class Server {

    public static void main(String[] args) {
        // Load .env into System properties so Spring can pick them up via relaxed binding
        try {
            Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

            // Map dotenv entries into System properties and also into dot-notated keys
            Set<DotenvEntry> entries = dotenv.entries();
            if (entries != null) {
                for (DotenvEntry entry : entries) {
                    String k = entry.getKey();
                    String v = entry.getValue();
                    if (k == null || v == null) continue;
                    // set original env-like key (e.g. AWS_ACCESS_KEY_ID)
                    System.setProperty(k, v);
                    // set dot-notated key (e.g. aws.access.key.id) for Spring @Value binding
                    String propKey = k.toLowerCase().replace('_', '.');
                    System.setProperty(propKey, v);
                }
            }
        } catch (Throwable t) {
            System.out.println("Warning loading .env: " + t.getMessage());
        }

        SpringApplication.run(Server.class, args);
    }
}

