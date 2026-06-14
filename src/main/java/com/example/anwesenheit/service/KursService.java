package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.repository.KursRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KursService {

    private final KursRepository kursRepository;

    public KursService(KursRepository kursRepository) {
        this.kursRepository = kursRepository;
    }

    public List<Kurs> getAllKurse() {
        return kursRepository.findAll();
    }

    public Kurs createKurs(Kurs kurs) {
        return kursRepository.save(kurs);
    }

    public Kurs updateKurs(Long id, Kurs updatedKurs) {
        Kurs kurs = kursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kurs nicht gefunden"));

        kurs.setName(updatedKurs.getName());
        kurs.setWochentag(updatedKurs.getWochentag());
        kurs.setUhrzeit(updatedKurs.getUhrzeit());
        kurs.setBeschreibung(updatedKurs.getBeschreibung());

        return kursRepository.save(kurs);
    }

    public void deleteKurs(Long id) {
        kursRepository.deleteById(id);
    }
}