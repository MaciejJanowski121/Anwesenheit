package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.model.TagesAnwesenheit;
import com.example.anwesenheit.repository.StudentRepository;
import com.example.anwesenheit.repository.TagesAnwesenheitRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
public class TagesAnwesenheitService {

    private final TagesAnwesenheitRepository repository;
    private final StudentRepository studentRepository;

    public TagesAnwesenheitService(
            TagesAnwesenheitRepository repository,
            StudentRepository studentRepository
    ) {
        this.repository = repository;
        this.studentRepository = studentRepository;
    }

    /* =====================================================
       DTO - EINZELNE ANWESENHEIT
       ===================================================== */

    public record AnwesenheitDto(
            LocalDate datum,
            String status,
            LocalTime abwesendAb,
            LocalTime abwesendBis,
            String grundAbwesenheit,
            Boolean anaAnwesenheitskontrolle,
            String bemerkung
    ) {}

    /* =====================================================
       DTO - SAMMELAKTUALISIERUNG
       ===================================================== */

    public record SammelAnwesenheitDto(
            LocalDate datum,
            List<Long> studentIds,
            Map<String, Object> aenderungen
    ) {}

    /* =====================================================
       ANWESENHEITEN EINES TAGES
       ===================================================== */

    @Transactional(readOnly = true)
    public List<TagesAnwesenheit> getByDatum(
            LocalDate datum
    ) {

        validateDatum(datum);

        return repository.findByDatum(datum);
    }

    /* =====================================================
       ANWESENHEITEN EINES SCHÜLERS
       ===================================================== */

    @Transactional(readOnly = true)
    public List<TagesAnwesenheit> getByStudent(
            Long studentId
    ) {

        requireStudent(studentId);

        return repository
                .findByStudentIdOrderByDatumDesc(
                        studentId
                );
    }

    /* =====================================================
       ANWESENHEITEN EINES ZEITRAUMS
       ===================================================== */

    @Transactional(readOnly = true)
    public List<TagesAnwesenheit> getByZeitraum(
            LocalDate von,
            LocalDate bis
    ) {

        validateZeitraum(von, bis);

        return repository
                .findByDatumBetweenOrderByDatumAsc(
                        von,
                        bis
                );
    }

    /* =====================================================
       ANWESENHEIT EINES SCHÜLERS AN EINEM TAG
       ===================================================== */

    @Transactional(readOnly = true)
    public TagesAnwesenheit getByStudentAndDatum(
            Long studentId,
            LocalDate datum
    ) {

        validateDatum(datum);

        requireStudent(studentId);

        return repository
                .findByStudentIdAndDatum(
                        studentId,
                        datum
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Anwesenheit wurde noch nicht erfasst."
                        )
                );
    }

    /* =====================================================
       EINZELNE ANWESENHEIT SPEICHERN
       ===================================================== */

    @Transactional
    public TagesAnwesenheit saveAnwesenheit(
            Long studentId,
            AnwesenheitDto dto
    ) {

        if (dto == null) {
            throw badRequest(
                    "Anwesenheitsdaten fehlen."
            );
        }

        validateDatum(dto.datum());

        Student student = requireStudent(studentId);

        TagesAnwesenheit entity = findOrCreate(
                student,
                dto.datum()
        );

        entity.setStatus(
                normalizeStatus(dto.status())
        );

        entity.setAbwesendAb(
                dto.abwesendAb()
        );

        entity.setAbwesendBis(
                dto.abwesendBis()
        );

        entity.setGrundAbwesenheit(
                normalizeText(dto.grundAbwesenheit())
        );

        entity.setAnaAnwesenheitskontrolle(
                Boolean.TRUE.equals(
                        dto.anaAnwesenheitskontrolle()
                )
        );

        entity.setBemerkung(
                normalizeText(dto.bemerkung())
        );

        validateAnwesenheit(entity);

        return repository.save(entity);
    }

    /* =====================================================
       EINZELNE FELDER AKTUALISIEREN
       ===================================================== */

    @Transactional
    public TagesAnwesenheit updateAnwesenheit(
            Long studentId,
            LocalDate datum,
            Map<String, Object> aenderungen
    ) {

        validateDatum(datum);

        validateAenderungen(aenderungen);

        Student student = requireStudent(studentId);

        TagesAnwesenheit entity = findOrCreate(
                student,
                datum
        );

        applyAenderungen(
                entity,
                aenderungen
        );

        validateAnwesenheit(entity);

        return repository.save(entity);
    }

    /* =====================================================
       SAMMELAKTUALISIERUNG
       ===================================================== */

    @Transactional
    public List<TagesAnwesenheit> saveSammelAnwesenheit(
            SammelAnwesenheitDto dto
    ) {

        if (dto == null) {
            throw badRequest(
                    "Anwesenheitsdaten fehlen."
            );
        }

        validateDatum(dto.datum());

        validateAenderungen(dto.aenderungen());

        if (dto.studentIds() == null ||
                dto.studentIds().isEmpty()) {

            throw badRequest(
                    "Es wurden keine Schüler ausgewählt."
            );
        }

        if (dto.studentIds().stream().anyMatch(id -> id == null)) {
            throw badRequest(
                    "Ungültige Schüler-ID."
            );
        }

        List<Long> studentIds = new ArrayList<>(
                new LinkedHashSet<>(
                        dto.studentIds()
                )
        );

        List<Student> students =
                studentRepository.findAllById(
                        studentIds
                );

        if (students.size() != studentIds.size()) {

            throw badRequest(
                    "Mindestens ein Schüler wurde nicht gefunden."
            );
        }

        List<TagesAnwesenheit> result =
                new ArrayList<>();

        for (Student student : students) {

            TagesAnwesenheit entity = findOrCreate(
                    student,
                    dto.datum()
            );

            applyAenderungen(
                    entity,
                    dto.aenderungen()
            );

            validateAnwesenheit(entity);

            result.add(entity);
        }

        return repository.saveAll(result);
    }

    /* =====================================================
       ÄNDERUNGEN ANWENDEN
       ===================================================== */

    private void applyAenderungen(
            TagesAnwesenheit entity,
            Map<String, Object> aenderungen
    ) {

        for (Map.Entry<String, Object> entry :
                aenderungen.entrySet()) {

            String field = entry.getKey();
            Object value = entry.getValue();

            switch (field) {

                case "status" ->
                        entity.setStatus(
                                normalizeStatus(
                                        readText(value)
                                )
                        );

                case "abwesendAb" ->
                        entity.setAbwesendAb(
                                parseTime(value)
                        );

                case "abwesendBis" ->
                        entity.setAbwesendBis(
                                parseTime(value)
                        );

                case "grundAbwesenheit" ->
                        entity.setGrundAbwesenheit(
                                normalizeText(
                                        readText(value)
                                )
                        );

                case "anaAnwesenheitskontrolle" -> {

                    if (!(value instanceof Boolean checked)) {

                        throw badRequest(
                                "Ungültiger Wert für ANA Anwesenheitskontrolle."
                        );
                    }

                    entity.setAnaAnwesenheitskontrolle(
                            checked
                    );
                }

                case "bemerkung" ->
                        entity.setBemerkung(
                                normalizeText(
                                        readText(value)
                                )
                        );

                default -> throw badRequest(
                        "Unbekanntes Feld: " + field
                );
            }
        }
    }

    /* =====================================================
       ANWESENHEIT LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteAnwesenheit(Long id) {

        TagesAnwesenheit entity =
                repository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Anwesenheit nicht gefunden."
                                )
                        );

        repository.delete(entity);
    }

    /* =====================================================
       SCHÜLERSTATISTIK
       ===================================================== */

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistik(
            Long studentId
    ) {

        requireStudent(studentId);

        List<TagesAnwesenheit> eintraege =
                repository
                        .findByStudentIdOrderByDatumDesc(
                                studentId
                        );

        long anwesend = eintraege.stream()
                .filter(entity ->
                        "ANWESEND".equals(entity.getStatus())
                )
                .count();

        long fehlend = eintraege.stream()
                .filter(entity ->
                        "FEHLT".equals(entity.getStatus())
                )
                .count();

        long teilweiseAbwesend = eintraege.stream()
                .filter(entity ->
                        !"FEHLT".equals(entity.getStatus())
                )
                .filter(entity ->
                        entity.getAbwesendAb() != null ||
                                entity.getAbwesendBis() != null
                )
                .count();

        return Map.of(
                "anzahlAnwesend", anwesend,
                "anzahlFehlend", fehlend,
                "anzahlTeilweiseAbwesend", teilweiseAbwesend
        );
    }

    /* =====================================================
       ANWESENHEIT FINDEN ODER ERSTELLEN
       ===================================================== */

    private TagesAnwesenheit findOrCreate(
            Student student,
            LocalDate datum
    ) {

        return repository
                .findByStudentIdAndDatum(
                        student.getId(),
                        datum
                )
                .orElseGet(() -> {

                    TagesAnwesenheit entity =
                            new TagesAnwesenheit();

                    entity.setStudent(student);
                    entity.setDatum(datum);
                    entity.setAnaAnwesenheitskontrolle(false);

                    return entity;
                });
    }

    /* =====================================================
       VALIDIERUNG DER ANWESENHEIT
       ===================================================== */

    private void validateAnwesenheit(
            TagesAnwesenheit entity
    ) {

        validateDatum(entity.getDatum());

        entity.setStatus(
                normalizeStatus(entity.getStatus())
        );

        /*
         * Bei vollständiger Abwesenheit werden
         * keine zusätzlichen Abwesenheitszeiten benötigt.
         */
        if ("FEHLT".equals(entity.getStatus())) {

            entity.setAbwesendAb(null);
            entity.setAbwesendBis(null);
        }

        validateTime(entity.getAbwesendAb());
        validateTime(entity.getAbwesendBis());

        if (entity.getAbwesendAb() != null &&
                entity.getAbwesendBis() != null &&
                !entity.getAbwesendAb()
                        .isBefore(entity.getAbwesendBis())) {

            throw badRequest(
                    "Abwesend ab muss vor Abwesend bis liegen."
            );
        }

        if (entity.getGrundAbwesenheit() != null &&
                entity.getGrundAbwesenheit().length() > 50) {

            throw badRequest(
                    "Der Abwesenheitsgrund darf maximal 50 Zeichen enthalten."
            );
        }

        if (entity.getAnaAnwesenheitskontrolle() == null) {
            entity.setAnaAnwesenheitskontrolle(false);
        }
    }

    /* =====================================================
       UHRZEIT VALIDIEREN
       ===================================================== */

    private void validateTime(LocalTime time) {

        if (time == null) {
            return;
        }

        if (time.isBefore(LocalTime.of(8, 0)) ||
                time.isAfter(LocalTime.of(16, 0))) {

            throw badRequest(
                    "Die Uhrzeit muss zwischen 08:00 und 16:00 liegen."
            );
        }

        if (time.getMinute() % 15 != 0 ||
                time.getSecond() != 0 ||
                time.getNano() != 0) {

            throw badRequest(
                    "Die Uhrzeit muss in 15-Minuten-Schritten angegeben werden."
            );
        }
    }

    /* =====================================================
       STATUS VALIDIEREN
       ===================================================== */

    private String normalizeStatus(String status) {

        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status
                .trim()
                .toUpperCase(java.util.Locale.ROOT);

        if (!"ANWESEND".equals(normalized) &&
                !"FEHLT".equals(normalized)) {

            throw badRequest(
                    "Ungültiger Anwesenheitsstatus."
            );
        }

        return normalized;
    }

    /* =====================================================
       DATUM VALIDIEREN
       ===================================================== */

    private void validateDatum(LocalDate datum) {

        if (datum == null) {

            throw badRequest(
                    "Das Datum darf nicht leer sein."
            );
        }
    }

    private void validateZeitraum(
            LocalDate von,
            LocalDate bis
    ) {

        validateDatum(von);
        validateDatum(bis);

        if (von.isAfter(bis)) {

            throw badRequest(
                    "Das Von-Datum darf nicht nach dem Bis-Datum liegen."
            );
        }
    }

    /* =====================================================
       ÄNDERUNGEN VALIDIEREN
       ===================================================== */

    private void validateAenderungen(
            Map<String, Object> aenderungen
    ) {

        if (aenderungen == null ||
                aenderungen.isEmpty()) {

            throw badRequest(
                    "Es wurden keine Änderungen angegeben."
            );
        }
    }

    /* =====================================================
       HILFSMETHODEN
       ===================================================== */

    private Student requireStudent(Long studentId) {

        return studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Schüler nicht gefunden."
                        )
                );
    }

    private String readText(Object value) {

        if (value == null) {
            return null;
        }

        if (!(value instanceof String text)) {

            throw badRequest(
                    "Ungültiger Textwert."
            );
        }

        return text;
    }

    private String normalizeText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private LocalTime parseTime(Object value) {

        String text = readText(value);

        if (text == null || text.isBlank()) {
            return null;
        }

        try {

            return LocalTime.parse(text.trim());

        } catch (java.time.format.DateTimeParseException ex) {

            throw badRequest(
                    "Ungültige Uhrzeit: " + text
            );
        }
    }

    private ResponseStatusException badRequest(
            String message
    ) {

        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message
        );
    }
}