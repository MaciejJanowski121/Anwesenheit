package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Angebot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AngebotRepository
        extends JpaRepository<Angebot, Long> {
}