package com.leafshop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "aws.ses")
public class SesProperties {

    /** AWS region for SES, e.g. ap-southeast-2 */
    private String region = "ap-southeast-2";

    /** Default From address (must be verified in SES if in sandbox) */
    private String from = "no-reply@example.com";

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }
}
