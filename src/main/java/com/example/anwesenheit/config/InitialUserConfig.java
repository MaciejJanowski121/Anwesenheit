package com.example.anwesenheit.config;

import com.example.anwesenheit.model.Role;
import com.example.anwesenheit.model.UserAccount;
import com.example.anwesenheit.repository.UserAccountRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class InitialUserConfig {

    @Bean
    public CommandLineRunner createInitialUsers(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {

            /*
             * ADMIN
             */
            if (!userAccountRepository.existsByUsername("Admin")) {

                UserAccount admin =
                        new UserAccount();

                admin.setUsername("Admin");

                admin.setPassword(
                        passwordEncoder.encode(
                                "Admin123!"
                        )
                );

                admin.setRole(
                        Role.ADMIN
                );

                admin.setEnabled(true);

                userAccountRepository.save(
                        admin
                );

                System.out.println(
                        "Initialer Benutzer 'Admin' wurde erstellt."
                );
            }

            /*
             * KURSLEITUNG / ANWENDER
             */
            if (!userAccountRepository.existsByUsername("Kursleitung")) {

                UserAccount kursleitung =
                        new UserAccount();

                kursleitung.setUsername(
                        "Kursleitung"
                );

                kursleitung.setPassword(
                        passwordEncoder.encode(
                                "Kursleitung123!"
                        )
                );

                kursleitung.setRole(
                        Role.ANWENDER
                );

                kursleitung.setEnabled(true);

                userAccountRepository.save(
                        kursleitung
                );

                System.out.println(
                        "Initialer Benutzer 'Kursleitung' wurde erstellt."
                );
            }
        };
    }
}