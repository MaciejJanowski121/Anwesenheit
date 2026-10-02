package com.example.anwesenheit.controller;

import com.example.anwesenheit.dto.LoginRequest;
import com.example.anwesenheit.model.UserAccount;
import com.example.anwesenheit.repository.UserAccountRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserAccountRepository userAccountRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserAccountRepository userAccountRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.userAccountRepository = userAccountRepository;
    }

    /*
     * Logowanie użytkownika.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest loginRequest,
            HttpServletRequest request
    ) {

        try {

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    loginRequest.getUsername(),
                                    loginRequest.getPassword()
                            )
                    );

            /*
             * Zapisujemy Authentication w SecurityContext.
             */
            SecurityContext securityContext =
                    SecurityContextHolder.createEmptyContext();

            securityContext.setAuthentication(authentication);

            SecurityContextHolder.setContext(securityContext);

            /*
             * Tworzymy sesję i zapisujemy SecurityContext.
             * Przeglądarka otrzyma cookie JSESSIONID.
             */
            HttpSession session =
                    request.getSession(true);

            session.setAttribute(
                    HttpSessionSecurityContextRepository
                            .SPRING_SECURITY_CONTEXT_KEY,
                    securityContext
            );

            UserAccount userAccount =
                    userAccountRepository
                            .findByUsername(authentication.getName())
                            .orElseThrow();

            return ResponseEntity.ok(
                    Map.of(
                            "username",
                            userAccount.getUsername(),
                            "role",
                            userAccount.getRole().name()
                    )
            );

        } catch (Exception exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    "Benutzername oder Passwort ist falsch."
                            )
                    );
        }
    }

    /*
     * Liefert den aktuell angemeldeten Benutzer.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(
            Authentication authentication
    ) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    "Nicht angemeldet."
                            )
                    );
        }

        UserAccount userAccount =
                userAccountRepository
                        .findByUsername(authentication.getName())
                        .orElse(null);

        if (userAccount == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    "Benutzer nicht gefunden."
                            )
                    );
        }

        return ResponseEntity.ok(
                Map.of(
                        "username",
                        userAccount.getUsername(),
                        "role",
                        userAccount.getRole().name()
                )
        );
    }

    /*
     * Abmelden und Session löschen.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Erfolgreich abgemeldet."
                )
        );
    }
}