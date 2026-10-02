package com.example.anwesenheit.controller;

import com.example.anwesenheit.dto.ChangePasswordRequest;
import com.example.anwesenheit.dto.CreateUserRequest;
import com.example.anwesenheit.dto.UpdateUserRequest;
import com.example.anwesenheit.model.Role;
import com.example.anwesenheit.model.UserAccount;
import com.example.anwesenheit.repository.UserAccountRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserAccountController {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountController(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userAccountRepository =
                userAccountRepository;

        this.passwordEncoder =
                passwordEncoder;
    }


    /* =====================================================
       ALLE BENUTZER
       ===================================================== */

    @GetMapping
    public List<Map<String, Object>> getAllUsers() {

        return userAccountRepository
                .findAll()
                .stream()
                .sorted(
                        Comparator.comparing(
                                UserAccount::getUsername,
                                String.CASE_INSENSITIVE_ORDER
                        )
                )
                .map(this::toResponse)
                .toList();
    }


    /* =====================================================
       BENUTZER ERSTELLEN
       ===================================================== */

    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestBody CreateUserRequest request
    ) {

        if (
                request.getUsername() == null ||
                        request.getUsername().trim().isEmpty()
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Bitte einen Benutzernamen eingeben."
                            )
                    );
        }

        if (
                request.getPassword() == null ||
                        request.getPassword().length() < 8
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Das Passwort muss mindestens 8 Zeichen lang sein."
                            )
                    );
        }

        if (request.getRole() == null) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Bitte eine Rolle auswählen."
                            )
                    );
        }

        String username =
                request
                        .getUsername()
                        .trim();

        if (
                userAccountRepository
                        .existsByUsername(username)
        ) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            Map.of(
                                    "message",
                                    "Dieser Benutzername existiert bereits."
                            )
                    );
        }

        UserAccount user =
                new UserAccount();

        user.setUsername(username);

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(
                request.getRole()
        );

        user.setEnabled(true);

        UserAccount savedUser =
                userAccountRepository.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        toResponse(savedUser)
                );
    }


    /* =====================================================
       BENUTZER ÄNDERN
       ===================================================== */

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {

        UserAccount user =
                userAccountRepository
                        .findById(id)
                        .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        if (
                request.getUsername() == null ||
                        request.getUsername().trim().isEmpty()
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Bitte einen Benutzernamen eingeben."
                            )
                    );
        }

        if (request.getRole() == null) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Bitte eine Rolle auswählen."
                            )
                    );
        }

        String username =
                request
                        .getUsername()
                        .trim();

        UserAccount existingUser =
                userAccountRepository
                        .findByUsername(username)
                        .orElse(null);

        if (
                existingUser != null &&
                        !existingUser.getId().equals(id)
        ) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            Map.of(
                                    "message",
                                    "Dieser Benutzername existiert bereits."
                            )
                    );
        }


        /* =================================================
           EIGENES KONTO SCHÜTZEN
           ================================================= */

        boolean ownAccount =
                authentication != null &&
                        authentication
                                .getName()
                                .equals(
                                        user.getUsername()
                                );

        if (
                ownAccount &&
                        Boolean.FALSE.equals(
                                request.getEnabled()
                        )
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Das eigene Benutzerkonto kann nicht deaktiviert werden."
                            )
                    );
        }


        /*
         * Der aktuell angemeldete Administrator darf
         * sich selbst nicht zum Anwender machen.
         */
        if (
                ownAccount &&
                        request.getRole() != Role.ADMIN
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Die eigene Administratorrolle kann nicht entfernt werden."
                            )
                    );
        }


        /* =================================================
           LETZTEN AKTIVEN ADMIN SCHÜTZEN
           ================================================= */

        boolean removesActiveAdmin =
                user.getRole() == Role.ADMIN &&
                        Boolean.TRUE.equals(
                                user.getEnabled()
                        ) &&
                        (
                                request.getRole() != Role.ADMIN ||
                                        Boolean.FALSE.equals(
                                                request.getEnabled()
                                        )
                        );

        if (
                removesActiveAdmin &&
                        countActiveAdmins() <= 1
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Der letzte aktive Administrator kann nicht deaktiviert oder zum Anwender geändert werden."
                            )
                    );
        }


        user.setUsername(
                username
        );

        user.setRole(
                request.getRole()
        );

        if (
                request.getEnabled() != null
        ) {
            user.setEnabled(
                    request.getEnabled()
            );
        }

        UserAccount savedUser =
                userAccountRepository
                        .save(user);

        return ResponseEntity.ok(
                toResponse(savedUser)
        );
    }


    /* =====================================================
       PASSWORT ÄNDERN
       ===================================================== */

    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request
    ) {

        UserAccount user =
                userAccountRepository
                        .findById(id)
                        .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        if (
                request.getPassword() == null ||
                        request.getPassword().length() < 8
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Das Passwort muss mindestens 8 Zeichen lang sein."
                            )
                    );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        userAccountRepository
                .save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Das Passwort wurde geändert."
                )
        );
    }


    /* =====================================================
       BENUTZER LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {

        UserAccount user =
                userAccountRepository
                        .findById(id)
                        .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .notFound()
                    .build();
        }


        /* =================================================
           EIGENES KONTO NICHT LÖSCHEN
           ================================================= */

        if (
                authentication != null &&
                        authentication
                                .getName()
                                .equals(
                                        user.getUsername()
                                )
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Das eigene Benutzerkonto kann nicht gelöscht werden."
                            )
                    );
        }


        /* =================================================
           LETZTEN AKTIVEN ADMIN NICHT LÖSCHEN
           ================================================= */

        if (
                user.getRole() == Role.ADMIN &&
                        Boolean.TRUE.equals(
                                user.getEnabled()
                        ) &&
                        countActiveAdmins() <= 1
        ) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Der letzte aktive Administrator kann nicht gelöscht werden."
                            )
                    );
        }


        userAccountRepository
                .delete(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Der Benutzer wurde gelöscht."
                )
        );
    }


    /* =====================================================
       AKTIVE ADMINISTRATOREN ZÄHLEN
       ===================================================== */

    private long countActiveAdmins() {

        return userAccountRepository
                .findAll()
                .stream()
                .filter(
                        user ->
                                user.getRole() ==
                                        Role.ADMIN
                )
                .filter(
                        user ->
                                Boolean.TRUE.equals(
                                        user.getEnabled()
                                )
                )
                .count();
    }


    /* =====================================================
       RESPONSE OHNE PASSWORT
       ===================================================== */

    private Map<String, Object> toResponse(
            UserAccount user
    ) {

        return Map.of(
                "id",
                user.getId(),
                "username",
                user.getUsername(),
                "role",
                user.getRole().name(),
                "enabled",
                Boolean.TRUE.equals(
                        user.getEnabled()
                )
        );
    }
}