package com.worthsnap.service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Not load-bearing for the deployed app: frontend and backend are meant to appear same-origin
// to the browser via a proxy/rewrite (Vite in dev, Vercel rewrites in prod), so browser calls to
// /api/** never actually cross origins. This just keeps direct-to-backend calls (e.g. manual
// testing) working from the real frontend origin instead of a stale hardcoded dev value.
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String appBaseUrl;

    public WebConfig(@Value("${app.base-url}") String appBaseUrl) {
        this.appBaseUrl = appBaseUrl;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(appBaseUrl)
                .allowedHeaders("*")
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE");
    }
}
