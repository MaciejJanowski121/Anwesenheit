package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Anwesenheit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnwesenheitRepository extends JpaRepository<Anwesenheit, Long> {
}
