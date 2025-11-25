package com.leafshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;

import com.leafshop.config.AppProperties;

@SpringBootApplication
@EnableCaching
@EnableConfigurationProperties({AppProperties.class})
public class Server {

    public static void main(String[] args) {
        SpringApplication.run(Server.class, args);
    }
}

