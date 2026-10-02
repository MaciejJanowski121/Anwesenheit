package com.example.anwesenheit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {

        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(
                    CorsRegistry registry
            ) {

                registry
                        .addMapping("/api/**")

                        /*
                         * Frontend lokalny podczas developmentu.
                         * Vite może uruchomić się np. na 5173,
                         * 5174 itd.
                         */
                        .allowedOriginPatterns(
                                "http://localhost:*",
                                "http://127.0.0.1:*"
                        )

                        .allowedMethods(
                                "GET",
                                "POST",
                                "PUT",
                                "PATCH",
                                "DELETE",
                                "OPTIONS"
                        )

                        .allowedHeaders("*")

                        /*
                         * Potrzebne dla JSESSIONID.
                         */
                        .allowCredentials(true);
            }
        };
    }
}