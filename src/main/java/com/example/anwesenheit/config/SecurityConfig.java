package com.example.anwesenheit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    /* =====================================================
       SECURITY
       ===================================================== */

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                /* =========================================
                   CSRF
                   ========================================= */

                .csrf(
                        csrf ->
                                csrf.disable()
                )

                /* =========================================
                   CORS
                   ========================================= */

                .cors(
                        cors -> {
                        }
                )

                /* =========================================
                   ZUGRIFFSRECHTE
                   ========================================= */

                .authorizeHttpRequests(
                        auth -> auth

                                /* =========================
                                   LOGIN

                                   Ohne Anmeldung erlaubt.
                                   ========================= */

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/auth/login"
                                )
                                .permitAll()


                                /* =========================
                                   AUTH

                                   Nur angemeldete Benutzer.
                                   ========================= */

                                .requestMatchers(
                                        "/api/auth/me",
                                        "/api/auth/logout"
                                )
                                .authenticated()


                                /* =========================
                                   ANWESENHEIT

                                   ADMIN + ANWENDER
                                   ========================= */

                                .requestMatchers(
                                        "/api/anwesenheiten/**"
                                )
                                .hasAnyRole(
                                        "ADMIN",
                                        "ANWENDER"
                                )


                                /* =========================
                                   KURSE LESEN

                                   ADMIN + ANWENDER
                                   ========================= */

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/kurse",
                                        "/api/kurse/**"
                                )
                                .hasAnyRole(
                                        "ADMIN",
                                        "ANWENDER"
                                )


                                /* =========================
                                   BUCHUNGEN LESEN

                                   ADMIN + ANWENDER
                                   ========================= */

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/buchungen/**"
                                )
                                .hasAnyRole(
                                        "ADMIN",
                                        "ANWENDER"
                                )


                                /* =========================
                                   RESTLICHE API

                                   Nur ADMIN.
                                   ========================= */

                                .requestMatchers(
                                        "/api/**"
                                )
                                .hasRole(
                                        "ADMIN"
                                )


                                /* =========================
                                   ALLES ANDERE
                                   ========================= */

                                .anyRequest()
                                .authenticated()
                )

                /* =========================================
                   KEIN SPRING FORM LOGIN

                   Wir verwenden unseren eigenen
                   /api/auth/login Endpoint.
                   ========================================= */

                .formLogin(
                        form ->
                                form.disable()
                )

                /* =========================================
                   KEIN HTTP BASIC
                   ========================================= */

                .httpBasic(
                        basic ->
                                basic.disable()
                );

        return http.build();
    }


    /* =====================================================
       PASSWORD ENCODER
       ===================================================== */

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    /* =====================================================
       AUTHENTICATION MANAGER

       Wird vom AuthController für
       Benutzername + Passwort benötigt.
       ===================================================== */

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration
                .getAuthenticationManager();
    }
}