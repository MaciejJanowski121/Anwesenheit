package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.model.TagesAnwesenheit;
import com.example.anwesenheit.repository.StudentRepository;
import com.example.anwesenheit.repository.TagesAnwesenheitRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class TagesAnwesenheitService {

    private final TagesAnwesenheitRepository repository;
    private final StudentRepository studentRepository;

    private static final int MAX_ZEITRAUM_TAGE = 366;

    private static final int MAX_SAMMEL_EINTRAEGE = 20000;

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
            LocalTime abwesendAb2,
            LocalTime abwesendBis2,
            String grundAbwesenheit2,
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
       DTO - SAMMELAKTUALISIERUNG ZEITRAUM
       ===================================================== */

    public record SammelAnwesenheitZeitraumDto(
            LocalDate von,
            LocalDate bis,
            List<DayOfWeek> wochentage,
            List<Long> studentIds,
            Map<String, Object> aenderungen
    ) {}

    /* =====================================================
       DTO - ERGEBNIS SAMMELAKTUALISIERUNG
       ===================================================== */

    public record SammelAnwesenheitZeitraumResponse(
            LocalDate von,
            LocalDate bis,
            int anzahlSchueler,
            int anzahlTage,
            int anzahlEintraege,
            List<LocalDate> gespeicherteTage
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
       SAMMELAKTUALISIERUNG EINES TAGES
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

        List<Student> students =
                requireStudents(dto.studentIds());

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
       SAMMELAKTUALISIERUNG EINES ZEITRAUMS
       ===================================================== */

    @Transactional
    public SammelAnwesenheitZeitraumResponse
    saveSammelAnwesenheitZeitraum(
            SammelAnwesenheitZeitraumDto dto
    ) {

        if (dto == null) {

            throw badRequest(
                    "Anwesenheitsdaten fehlen."
            );
        }

        validateZeitraum(
                dto.von(),
                dto.bis()
        );

        validateAenderungen(
                dto.aenderungen()
        );

        long zeitraumTage =
                ChronoUnit.DAYS.between(
                        dto.von(),
                        dto.bis()
                ) + 1;

        if (zeitraumTage > MAX_ZEITRAUM_TAGE) {

            throw badRequest(
                    "Der Zeitraum darf maximal " +
                            MAX_ZEITRAUM_TAGE +
                            " Kalendertage umfassen."
            );
        }

        Set<DayOfWeek> wochentage =
                validateWochentage(
                        dto.wochentage()
                );

        List<LocalDate> tage =
                getAusgewaehlteTage(
                        dto.von(),
                        dto.bis(),
                        wochentage
                );

        if (tage.isEmpty()) {

            throw badRequest(
                    "Im ausgewählten Zeitraum liegen keine " +
                            "der ausgewählten Wochentage."
            );
        }

        List<Student> students =
                requireStudents(
                        dto.studentIds()
                );

        long anzahlEintraege =
                (long) students.size() * tage.size();

        if (anzahlEintraege > MAX_SAMMEL_EINTRAEGE) {

            throw badRequest(
                    "Es können maximal " +
                            MAX_SAMMEL_EINTRAEGE +
                            " Anwesenheitseinträge gleichzeitig " +
                            "gespeichert werden. Bitte wählen Sie " +
                            "einen kleineren Zeitraum oder weniger Schüler."
            );
        }

        List<Long> studentIds = students.stream()
                .map(Student::getId)
                .toList();

        /*
         * Bestehende Anwesenheiten gesammelt laden,
         * statt für jeden Schüler und jeden Tag
         * eine separate Datenbankabfrage auszuführen.
         */

        Map<AnwesenheitKey, TagesAnwesenheit>
                vorhandeneAnwesenheiten =
                new java.util.HashMap<>();

        for (TagesAnwesenheit entity :
                repository.findByStudentIdInAndDatumBetween(
                        studentIds,
                        dto.von(),
                        dto.bis()
                )) {

            if (!wochentage.contains(
                    entity.getDatum().getDayOfWeek()
            )) {

                continue;
            }

            AnwesenheitKey key =
                    new AnwesenheitKey(
                            entity.getStudent().getId(),
                            entity.getDatum()
                    );

            vorhandeneAnwesenheiten.put(
                    key,
                    entity
            );
        }

        List<TagesAnwesenheit> result =
                new ArrayList<>();

        for (LocalDate datum : tage) {

            for (Student student : students) {

                AnwesenheitKey key =
                        new AnwesenheitKey(
                                student.getId(),
                                datum
                        );

                TagesAnwesenheit entity =
                        vorhandeneAnwesenheiten.get(key);

                if (entity == null) {

                    entity = new TagesAnwesenheit();

                    entity.setStudent(student);
                    entity.setDatum(datum);

                    entity.setAnaAnwesenheitskontrolle(
                            false
                    );
                }

                try {

                    applyAenderungen(
                            entity,
                            dto.aenderungen()
                    );

                    validateAnwesenheit(entity);

                } catch (ResponseStatusException exception) {

                    throw badRequest(
                            "Fehler bei Schüler-ID " +
                                    student.getId() +
                                    " am " +
                                    datum +
                                    ": " +
                                    exception.getReason()
                    );
                }

                result.add(entity);
            }
        }

        repository.saveAll(result);

        return new SammelAnwesenheitZeitraumResponse(
                dto.von(),
                dto.bis(),
                students.size(),
                tage.size(),
                result.size(),
                List.copyOf(tage)
        );
    }

    /* =====================================================
       SCHLÜSSEL FÜR BESTEHENDE ANWESENHEITEN
       ===================================================== */

    private record AnwesenheitKey(
            Long studentId,
            LocalDate datum
    ) {}

    /* =====================================================
       WOCHENTAGE VALIDIEREN
       ===================================================== */

    private Set<DayOfWeek> validateWochentage(
            List<DayOfWeek> wochentage
    ) {

        if (wochentage == null ||
                wochentage.isEmpty()) {

            throw badRequest(
                    "Bitte wählen Sie mindestens einen Wochentag aus."
            );
        }

        Set<DayOfWeek> result =
                new LinkedHashSet<>();

        for (DayOfWeek wochentag : wochentage) {

            if (wochentag == null) {

                throw badRequest(
                        "Ungültiger Wochentag."
                );
            }

            if (wochentag == DayOfWeek.SATURDAY ||
                    wochentag == DayOfWeek.SUNDAY) {

                throw badRequest(
                        "Es können nur Wochentage von " +
                                "Montag bis Freitag ausgewählt werden."
                );
            }

            result.add(wochentag);
        }

        return result;
    }

    /* =====================================================
       AUSGEWÄHLTE TAGE ERMITTELN
       ===================================================== */

    private List<LocalDate> getAusgewaehlteTage(
            LocalDate von,
            LocalDate bis,
            Set<DayOfWeek> wochentage
    ) {

        List<LocalDate> result =
                new ArrayList<>();

        LocalDate datum = von;

        while (true) {

            if (wochentage.contains(
                    datum.getDayOfWeek()
            )) {

                result.add(datum);
            }

            if (datum.equals(bis)) {
                break;
            }

            datum = datum.plusDays(1);
        }

        return result;
    }

    /* =====================================================
       SCHÜLER FÜR SAMMELAKTUALISIERUNG LADEN
       ===================================================== */

    private List<Student> requireStudents(
            List<Long> studentIds
    ) {

        if (studentIds == null ||
                studentIds.isEmpty()) {

            throw badRequest(
                    "Es wurden keine Schüler ausgewählt."
            );
        }

        if (studentIds.stream().anyMatch(
                id -> id == null || id <= 0
        )) {

            throw badRequest(
                    "Ungültige Schüler-ID."
            );
        }

        List<Long> uniqueStudentIds =
                new ArrayList<>(
                        new LinkedHashSet<>(
                                studentIds
                        )
                );

        List<Student> students =
                studentRepository.findAllById(
                        uniqueStudentIds
                );

        if (students.size() != uniqueStudentIds.size()) {

            throw badRequest(
                    "Mindestens ein Schüler wurde nicht gefunden."
            );
        }

        return students;
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