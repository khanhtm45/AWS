package com.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.server.config.AppProperties;

@SpringBootApplication
@EnableConfigurationProperties({AppProperties.class})
public class Server {

    public static void main(String[] args) {
        SpringApplication.run(Server.class, args);
    }
}
