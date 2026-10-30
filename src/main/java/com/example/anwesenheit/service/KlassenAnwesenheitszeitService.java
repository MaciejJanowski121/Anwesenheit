package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Klasse;
import com.example.anwesenheit.model.KlassenAnwesenheitszeit;
import com.example.anwesenheit.repository.KlasseRepository;
import com.example.anwesenheit.repository.KlassenAnwesenheitszeitRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class KlassenAnwesenheitszeitService {

    private final KlassenAnwesenheitszeitRepository zeitenRepository;
    private final KlasseRepository klasseRepository;
    private final StudentRepository studentRepository;

    public KlassenAnwesenheitszeitService(
            KlassenAnwesenheitszeitRepository zeitenRepository,
            KlasseRepository klasseRepository,
            StudentRepository studentRepository
    ) {
        this.zeitenRepository = zeitenRepository;
        this.klasseRepository = klasseRepository;
        this.studentRepository = studentRepository;
    }

    public record ZeitDto(
            DayOfWeek wochentag,
            LocalTime beginn,
            LocalTime ende
    ) {}

    @Transactional(readOnly = true)
    public List<Integer> getJahrgaenge(Long klasseId) {
        requireKlasse(klasseId);

        return studentRepository.findAll().stream()
                .filter(student -> student.getKlasseEntity() != null)
                .filter(student -> klasseId.equals(student.getKlasseEntity().getId()))
                .map(student -> student.getJahrgang())
                .filter(jahrgang -> jahrgang != null)
                .distinct()
                .sorted()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ZeitDto> getZeiten(Long klasseId, Integer jahrgang) {
        requireKlasse(klasseId);

        Map<DayOfWeek, KlassenAnwesenheitszeit> gespeichert =
                zeitenRepository
                        .findByKlasseIdAndJahrgangOrderByWochentagAsc(
                                klasseId, jahrgang
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                KlassenAnwesenheitszeit::getWochentag,
                                zeit -> zeit
                        ));

        return werktage().stream()
                .map(tag -> {
                    KlassenAnwesenheitszeit zeit = gespeichert.get(tag);
                    return new ZeitDto(
                            tag,
                            zeit == null ? null : zeit.getBeginn(),
                            zeit == null ? null : zeit.getEnde()
                    );
                })
                .toList();
    }

    @Transactional
    public List<ZeitDto> saveZeiten(
            Long klasseId,
            Integer jahrgang,
            List<ZeitDto> zeiten
    ) {
        Klasse klasse = requireKlasse(klasseId);

        if (jahrgang == null || !getJahrgaenge(klasseId).contains(jahrgang)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der Jahrgang gehört nicht zu dieser Klasse."
            );
        }

        if (zeiten == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Anwesenheitszeiten fehlen."
            );
        }

        if (zeiten.size() != 5 ||
                zeiten.stream().anyMatch(z -> z == null || !werktage().contains(z.wochentag())) ||
                zeiten.stream().map(ZeitDto::wochentag).distinct().count() != 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Es müssen genau fünf unterschiedliche Werktage angegeben werden."
            );
        }

        for (ZeitDto zeit : zeiten) {
            if (zeit.beginn() != null && zeit.ende() != null &&
                    !zeit.beginn().isBefore(zeit.ende())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Beginn muss vor Ende liegen."
                );
            }
        }

        for (ZeitDto dto : zeiten) {
            KlassenAnwesenheitszeit entity = zeitenRepository
                    .findByKlasseIdAndJahrgangAndWochentag(
                            klasseId, jahrgang, dto.wochentag()
                    )
                    .orElseGet(KlassenAnwesenheitszeit::new);

            entity.setKlasse(klasse);
            entity.setJahrgang(jahrgang);
            entity.setWochentag(dto.wochentag());
            entity.setBeginn(dto.beginn());
            entity.setEnde(dto.ende());

            zeitenRepository.save(entity);
        }

        return getZeiten(klasseId, jahrgang);
    }

    private Klasse requireKlasse(Long klasseId) {
        return klasseRepository.findById(klasseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Klasse nicht gefunden."
                ));
    }

    private List<DayOfWeek> werktage() {
        return Arrays.asList(
                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY
        );
    }
}