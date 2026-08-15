package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository
        extends JpaRepository<Student, Long> {

    /*
     * Alle Schüler eines Jahrgangs.
     */
    List<Student> findByJahrgang(
            Integer jahrgang
    );

    /*
     * Schüler anhand der eindeutigen ID_Kind suchen.
     *
     * Diese ID stammt aus der Importdatei und bleibt
     * unabhängig von der internen Datenbank-ID bestehen.
     */
    Optional<Student> findByIdKind(
            Long idKind
    );

    /*
     * Prüft, ob bereits ein Schüler mit dieser
     * ID_Kind existiert.
     */
    boolean existsByIdKind(
            Long idKind
    );
}