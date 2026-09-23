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
                         */
                        .allowedOrigins(
                                "http://localhost:5173"
                        )

                        /*
                         * PATCH jest potrzebny m.in. do
                         * aktualizacji Besonderheiten.
                         */
                        .allowedMethods(
                                "GET",
                                "POST",
                                "PUT",
                                "PATCH",
                                "DELETE",
                                "OPTIONS"
                        )

                        .allowedHeaders("*");
            }
        };
    }
}