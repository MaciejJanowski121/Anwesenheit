package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.AnaArchivFilter;
import com.example.anwesenheit.model.AnwesenheitsverlaufFilter;
import com.example.anwesenheit.model.AnwesenheitszeitenFilter;

import com.example.anwesenheit.service.export.AbwesenheitPdfExportService;
import com.example.anwesenheit.service.export.AnaBuchungenPdfExportService;
import com.example.anwesenheit.service.export.AngebotBuchungenPdfExportService;
import com.example.anwesenheit.service.export.SchuelerBuchungenPdfExportService;
import com.example.anwesenheit.service.export.TagesAnwesenheitExcelExportService;
import com.example.anwesenheit.service.export.AnwesenheitszeitenPdfExportService;
import com.example.anwesenheit.service.export.AnaArchivExcelExportService;

import com.lowagie.text.DocumentException;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

import java.time.LocalDate;
import java.time.ZoneId;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/exporte")
public class ExportController {

    /* =====================================================
       MEDIA TYPES
       ===================================================== */

    private static final String XLSX_MEDIA_TYPE =
            "application/vnd.openxmlformats-officedocument"
                    + ".spreadsheetml.sheet";


    /* =====================================================
       SERVICES
       ===================================================== */

    private final AbwesenheitPdfExportService
            abwesenheitPdfExportService;

    private final AnaBuchungenPdfExportService
            anaBuchungenPdfExportService;

    private final AngebotBuchungenPdfExportService
            angebotBuchungenPdfExportService;

    private final SchuelerBuchungenPdfExportService
            schuelerBuchungenPdfExportService;

    private final TagesAnwesenheitExcelExportService
            tagesAnwesenheitExcelExportService;

    private final AnwesenheitszeitenPdfExportService
            anwesenheitszeitenPdfExportService;

    private final AnaArchivExcelExportService
            anaArchivExcelExportService;


    /* =====================================================
       ABWESENHEITSLISTE PDF
       ===================================================== */

    @GetMapping(
            value = "/abwesenheit",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> exportAbwesenheit(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate datum

    ) {

        try {

            byte[] pdf =
                    abwesenheitPdfExportService
                            .exportAbwesenheiten(datum);

            return createPdfResponse(
                    pdf,
                    "Abwesenheitsliste_" + datum + ".pdf"
            );

        } catch (DocumentException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Die Abwesenheitsliste konnte nicht erstellt werden.",
                    exception
            );
        }
    }


    /* =====================================================
       ANA-BUCHUNGEN PDF
       ===================================================== */

    @GetMapping(
            value = "/ana-buchungen",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> exportAnaBuchungen() {

        try {

            byte[] pdf =
                    anaBuchungenPdfExportService
                            .exportAnaBuchungen();

            return createPdfResponse(
                    pdf,
                    "ANA_Buchungen_" + getToday() + ".pdf"
            );

        } catch (DocumentException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Die ANA-Buchungen konnten nicht exportiert werden.",
                    exception
            );
        }
    }


    /* =====================================================
       ANGEBOTSBUCHUNGEN PDF
       ===================================================== */

    @GetMapping(
            value = "/angebot-buchungen",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> exportAngebotBuchungen() {

        try {

            byte[] pdf =
                    angebotBuchungenPdfExportService
                            .exportAngebotBuchungen();

            return createPdfResponse(
                    pdf,
                    "Angebotsbuchungen_" + getToday() + ".pdf"
            );

        } catch (DocumentException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Die Angebotsbuchungen konnten nicht exportiert werden.",
                    exception
            );
        }
    }


    /* =====================================================
       SCHÜLERBUCHUNGEN PDF
       ===================================================== */

    @GetMapping(
            value = "/schueler-buchungen",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> exportSchuelerBuchungen() {

        try {

            byte[] pdf =
                    schuelerBuchungenPdfExportService
                            .exportSchuelerBuchungen();

            return createPdfResponse(
                    pdf,
                    "Schuelerbuchungen_" + getToday() + ".pdf"
            );

        } catch (DocumentException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Die Schülerbuchungen konnten nicht exportiert werden.",
                    exception
            );
        }
    }


    /* =====================================================
       ANWESENHEITSZEITEN PDF
       ===================================================== */

    @GetMapping(
            value = "/anwesenheitszeiten",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> exportAnwesenheitszeiten(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate datum,

            @RequestParam(defaultValue = "ALLE")
            AnwesenheitszeitenFilter filterTyp,

            @RequestParam(required = false)
            Long filterId

    ) {

        try {

            byte[] pdf =
                    anwesenheitszeitenPdfExportService
                            .exportAnwesenheitszeiten(
                                    datum,
                                    filterTyp,
                                    filterId
                            );

            String filename =
                    "Anwesenheitszeiten_"
                            + filterTyp.name()
                            + "_"
                            + datum
                            + ".pdf";

            return createPdfResponse(
                    pdf,
                    filename
            );

        } catch (DocumentException | IOException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Die Anwesenheitszeiten konnten nicht exportiert werden.",
                    exception
            );
        }
    }


    /* =====================================================
       ANWESENHEITSVERLAUF EXCEL
       ===================================================== */

    @GetMapping(
            value = "/anwesenheitsverlauf",
            produces = XLSX_MEDIA_TYPE
    )
    public ResponseEntity<byte[]> exportAnwesenheitsverlauf(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate von,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate bis,

            @RequestParam(defaultValue = "ALLE")
            AnwesenheitsverlaufFilter filterTyp,

            @RequestParam(required = false)
            Long filterId

    ) {

        try {

            byte[] excel =
                    tagesAnwesenheitExcelExportService
                            .exportAnwesenheitsverlauf(
                                    von,
                                    bis,
                                    filterTyp,
                                    filterId
                            );

            String filename =
                    "Anwesenheitsverlauf_"
                            + filterTyp.name()
                            + "_"
                            + von
                            + "_bis_"
                            + bis
                            + ".xlsx";

            return createExcelResponse(
                    excel,
                    filename
            );

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Der Anwesenheitsverlauf konnte nicht exportiert werden.",
                    exception
            );
        }
    }


    /* =====================================================
       ANA-ANWESENHEITSARCHIV EXCEL
       ===================================================== */

    @GetMapping(
            value = "/ana-archiv",
            produces = XLSX_MEDIA_TYPE
    )
    public ResponseEntity<byte[]> exportAnaArchiv(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate von,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate bis,

            @RequestParam(defaultValue = "ALLE")
            AnaArchivFilter filterTyp,

            @RequestParam(required = false)
            Long filterId

    ) {

        try {

            byte[] excel =
                    anaArchivExcelExportService
                            .exportAnaArchiv(
                                    von,
                                    bis,
                                    filterTyp,
                                    filterId
                            );

            String filename =
                    "ANA_Anwesenheitsarchiv_"
                            + filterTyp.name()
                            + "_"
                            + von
                            + "_bis_"
                            + bis
                            + ".xlsx";

            return createExcelResponse(
                    excel,
                    filename
            );

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Das ANA-Anwesenheitsarchiv konnte nicht exportiert werden.",
                    exception
            );
        }
    }


    /* =====================================================
       PDF RESPONSE
       ===================================================== */

    private ResponseEntity<byte[]> createPdfResponse(
            byte[] pdf,
            String filename
    ) {

        return createFileResponse(
                pdf,
                filename,
                MediaType.APPLICATION_PDF
        );
    }


    /* =====================================================
       EXCEL RESPONSE
       ===================================================== */

    private ResponseEntity<byte[]> createExcelResponse(
            byte[] excel,
            String filename
    ) {

        return createFileResponse(
                excel,
                filename,
                MediaType.parseMediaType(
                        XLSX_MEDIA_TYPE
                )
        );
    }


    /* =====================================================
       GEMEINSAME DATEI RESPONSE
       ===================================================== */

    private ResponseEntity<byte[]> createFileResponse(
            byte[] data,
            String filename,
            MediaType mediaType
    ) {

        return ResponseEntity.ok()

                .contentType(mediaType)

                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition
                                .attachment()
                                .filename(filename)
                                .build()
                                .toString()
                )

                .header(
                        HttpHeaders.CACHE_CONTROL,
                        "no-store"
                )

                .contentLength(data.length)

                .body(data);
    }


    /* =====================================================
       HEUTIGES DATUM
       ===================================================== */

    private LocalDate getToday() {

        return LocalDate.now(
                ZoneId.of("Europe/Berlin")
        );
    }
}