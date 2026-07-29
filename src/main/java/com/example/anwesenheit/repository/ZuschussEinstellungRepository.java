package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.ZuschussEinstellung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ZuschussEinstellungRepository extends JpaRepository<ZuschussEinstellung, Long> {

    Optional<ZuschussEinstellung> findBySchuljahr(String schuljahr);

}