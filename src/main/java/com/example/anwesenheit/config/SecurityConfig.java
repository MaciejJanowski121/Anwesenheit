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

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                .csrf(csrf -> csrf.disable())

                .cors(cors -> {})

                .authorizeHttpRequests(auth -> auth

                        /* LOGIN */

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login"
                        )
                        .permitAll()


                        /* AUTH */

                        .requestMatchers(
                                "/api/auth/me",
                                "/api/auth/logout"
                        )
                        .authenticated()


                        /* EXPORTE */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/exporte/abwesenheit",
                                "/api/exporte/ana-buchungen",
                                "/api/exporte/angebot-buchungen",
                                "/api/exporte/schueler-buchungen",
                                "/api/exporte/anwesenheitsverlauf",
                                "/api/exporte/anwesenheitszeiten",
                                "/api/exporte/ana-archiv"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* ANWESENHEITSZEITEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/anwesenheitszeiten",
                                "/api/anwesenheitszeiten/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* GRUPPENANWESENHEIT */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/gruppen-anwesenheit",
                                "/api/gruppen-anwesenheit/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* TAGESANWESENHEIT LÖSCHEN */

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/tages-anwesenheiten/**"
                        )
                        .hasRole("ADMIN")


                        /* TAGESANWESENHEIT LESEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tages-anwesenheiten",
                                "/api/tages-anwesenheiten/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* TAGESANWESENHEIT SPEICHERN */

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tages-anwesenheiten/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* TAGESANWESENHEIT ÄNDERN */

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/tages-anwesenheiten/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* =================================================
                           HISTORISCHES ANA-ANWESENHEITSARCHIV

                           Nur lesender Zugriff.
                           ================================================= */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/anwesenheiten",
                                "/api/anwesenheiten/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* =================================================
                           HISTORISCHE ANA-DATEN SCHÜTZEN

                           Keine Änderungen oder Löschungen
                           über die bisherige Anwesenheits-API.
                           ================================================= */

                        .requestMatchers(
                                "/api/anwesenheiten",
                                "/api/anwesenheiten/**"
                        )
                        .denyAll()


                        /* ANGEBOTE LESEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/angebote",
                                "/api/angebote/**",
                                "/api/angebot-teilnahmen",
                                "/api/angebot-teilnahmen/**",
                                "/api/angebot-anwesenheiten",
                                "/api/angebot-anwesenheiten/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* KURSE LESEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/kurse",
                                "/api/kurse/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* BUCHUNGEN LESEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/buchungen",
                                "/api/buchungen/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* SCHÜLERINFOS LESEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/schuelerinfos",
                                "/api/schuelerinfos/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* KLASSEN LESEN */

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/klassen",
                                "/api/klassen/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "ANWENDER"
                        )


                        /* RESTLICHE API */

                        .requestMatchers(
                                "/api/**"
                        )
                        .hasRole("ADMIN")


                        /* ALLES ANDERE */

                        .anyRequest()
                        .authenticated()
                )

                .formLogin(form -> form.disable())

                .httpBasic(basic -> basic.disable());

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
       ===================================================== */

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }
}