import { useEffect, useState } from "react";
import {
    getZuschussBerechnung
} from "../services/zuschussService";

import {
    getBySchuljahr,
    createEinstellung,
    updateEinstellung
} from "../services/zuschussEinstellungService";

import "./ZuschuessePage.css";

const LEERE_EINSTELLUNG = {
    id: null,
    schuljahr: "",
    kurzgruppeBetrag: "",
    langgruppe12Betrag: "",
    langgruppe14Betrag: "",
    langgruppe510Betrag: ""
};

function ZuschuessePage() {
    const [schuljahr, setSchuljahr] = useState("2026/2027");

    const [berechnung, setBerechnung] = useState(null);

    const [einstellung, setEinstellung] = useState({
        ...LEERE_EINSTELLUNG,
        schuljahr: "2026/2027"
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        ladeSeite();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ladeSeite = async () => {
        if (!schuljahr.trim()) {
            setError("Bitte geben Sie ein Schuljahr ein.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        await ladeEinstellungen();
        await ladeBerechnung();

        setLoading(false);
    };

    const ladeEinstellungen = async () => {
        try {
            const daten = await getBySchuljahr(schuljahr.trim());

            setEinstellung({
                id: daten.id ?? null,
                schuljahr: daten.schuljahr ?? schuljahr.trim(),
                kurzgruppeBetrag: daten.kurzgruppeBetrag ?? "",
                langgruppe12Betrag: daten.langgruppe12Betrag ?? "",
                langgruppe14Betrag: daten.langgruppe14Betrag ?? "",
                langgruppe510Betrag: daten.langgruppe510Betrag ?? ""
            });
        } catch (err) {
            console.error("Zuschusseinstellungen konnten nicht geladen werden:", err);

            /*
             * Wenn für das Schuljahr noch keine Einstellungen vorhanden sind,
             * wird ein leerer Datensatz angezeigt.
             */
            setEinstellung({
                ...LEERE_EINSTELLUNG,
                schuljahr: schuljahr.trim()
            });
        }
    };

    const ladeBerechnung = async () => {
        try {
            const daten = await getZuschussBerechnung(schuljahr.trim());
            setBerechnung(daten);
        } catch (err) {
            console.error("Zuschussberechnung konnte nicht geladen werden:", err);

            setBerechnung(null);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Die Zuschussberechnung konnte nicht geladen werden.";

            setError(message);
        }
    };

    const handleSchuljahrChange = (event) => {
        const neuesSchuljahr = event.target.value;

        setSchuljahr(neuesSchuljahr);
        setSuccess("");
        setError("");
    };

    const handleEinstellungChange = (event) => {
        const { name, value } = event.target;

        setEinstellung((vorher) => ({
            ...vorher,
            [name]: value
        }));

        setSuccess("");
    };

    const speichereEinstellungen = async (event) => {
        event.preventDefault();

        if (!schuljahr.trim()) {
            setError("Bitte geben Sie ein Schuljahr ein.");
            return;
        }

        if (!sindBetraegeGueltig()) {
            setError(
                "Bitte geben Sie für alle Zuschussbeträge gültige Werte ein."
            );
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        const daten = {
            schuljahr: schuljahr.trim(),
            kurzgruppeBetrag: Number(einstellung.kurzgruppeBetrag),
            langgruppe12Betrag: Number(
                einstellung.langgruppe12Betrag
            ),
            langgruppe14Betrag: Number(
                einstellung.langgruppe14Betrag
            ),
            langgruppe510Betrag: Number(
                einstellung.langgruppe510Betrag
            )
        };

        try {
            let gespeichert;

            if (einstellung.id) {
                gespeichert = await updateEinstellung(
                    einstellung.id,
                    daten
                );
            } else {
                gespeichert = await createEinstellung(daten);
            }

            setEinstellung({
                id: gespeichert.id,
                schuljahr: gespeichert.schuljahr,
                kurzgruppeBetrag:
                    gespeichert.kurzgruppeBetrag ?? "",
                langgruppe12Betrag:
                    gespeichert.langgruppe12Betrag ?? "",
                langgruppe14Betrag:
                    gespeichert.langgruppe14Betrag ?? "",
                langgruppe510Betrag:
                    gespeichert.langgruppe510Betrag ?? ""
            });

            setSuccess(
                "Die Zuschusseinstellungen wurden erfolgreich gespeichert."
            );

            await ladeBerechnung();
        } catch (err) {
            console.error("Speichern fehlgeschlagen:", err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Die Zuschusseinstellungen konnten nicht gespeichert werden.";

            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const sindBetraegeGueltig = () => {
        const betraege = [
            einstellung.kurzgruppeBetrag,
            einstellung.langgruppe12Betrag,
            einstellung.langgruppe14Betrag,
            einstellung.langgruppe510Betrag
        ];

        return betraege.every((betrag) => {
            if (betrag === "" || betrag === null) {
                return false;
            }

            const zahl = Number(betrag);

            return Number.isFinite(zahl) && zahl >= 0;
        });
    };

    const formatiereBetrag = (betrag) => {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR"
        }).format(Number(betrag) || 0);
    };

    const formatiereZahl = (wert) => {
        return new Intl.NumberFormat("de-DE", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(Number(wert) || 0);
    };

    return (
        <div className="zuschuesse-page">
            <section className="zuschuesse-header">
                <div>
                    <h1>Zuschüsse</h1>

                    <p>
                        Berechnung der Zählschüler, Gruppen und
                        Zuschussbeträge
                    </p>
                </div>

                <div className="zuschuesse-filter">
                    <div className="zuschuesse-filter-field">
                        <label htmlFor="schuljahr">
                            Schuljahr
                        </label>

                        <input
                            id="schuljahr"
                            type="text"
                            value={schuljahr}
                            onChange={handleSchuljahrChange}
                            placeholder="2026/2027"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={ladeSeite}
                        disabled={loading || !schuljahr.trim()}
                    >
                        {loading
                            ? "Wird geladen..."
                            : "Berechnen"}
                    </button>
                </div>
            </section>

            {error && (
                <div className="zuschuesse-message zuschuesse-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="zuschuesse-message zuschuesse-success">
                    {success}
                </div>
            )}

            <section className="zuschuesse-settings-section">
                <div className="zuschuesse-section-header">
                    <div>
                        <h2>Zuschusseinstellungen</h2>

                        <p>
                            Zuschussbeträge für das Schuljahr{" "}
                            {schuljahr || "–"}
                        </p>
                    </div>

                    <span className="zuschuesse-status">
                        {einstellung.id
                            ? "Einstellungen vorhanden"
                            : "Neue Einstellungen"}
                    </span>
                </div>

                <form
                    className="zuschuesse-settings-form"
                    onSubmit={speichereEinstellungen}
                >
                    <div className="zuschuesse-settings-grid">
                        <div className="zuschuesse-input-group">
                            <label htmlFor="kurzgruppeBetrag">
                                Kurzgruppe
                            </label>

                            <div className="zuschuesse-currency-input">
                                <input
                                    id="kurzgruppeBetrag"
                                    name="kurzgruppeBetrag"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        einstellung.kurzgruppeBetrag
                                    }
                                    onChange={
                                        handleEinstellungChange
                                    }
                                    placeholder="9348"
                                />

                                <span>€</span>
                            </div>
                        </div>

                        <div className="zuschuesse-input-group">
                            <label htmlFor="langgruppe12Betrag">
                                Langgruppe 1–2
                            </label>

                            <div className="zuschuesse-currency-input">
                                <input
                                    id="langgruppe12Betrag"
                                    name="langgruppe12Betrag"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        einstellung.langgruppe12Betrag
                                    }
                                    onChange={
                                        handleEinstellungChange
                                    }
                                    placeholder="52772"
                                />

                                <span>€</span>
                            </div>
                        </div>

                        <div className="zuschuesse-input-group">
                            <label htmlFor="langgruppe14Betrag">
                                Langgruppe 1–4
                            </label>

                            <div className="zuschuesse-currency-input">
                                <input
                                    id="langgruppe14Betrag"
                                    name="langgruppe14Betrag"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        einstellung.langgruppe14Betrag
                                    }
                                    onChange={
                                        handleEinstellungChange
                                    }
                                    placeholder="35491"
                                />

                                <span>€</span>
                            </div>
                        </div>

                        <div className="zuschuesse-input-group">
                            <label htmlFor="langgruppe510Betrag">
                                Langgruppe 5–10
                            </label>

                            <div className="zuschuesse-currency-input">
                                <input
                                    id="langgruppe510Betrag"
                                    name="langgruppe510Betrag"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        einstellung.langgruppe510Betrag
                                    }
                                    onChange={
                                        handleEinstellungChange
                                    }
                                    placeholder="35491"
                                />

                                <span>€</span>
                            </div>
                        </div>
                    </div>

                    <div className="zuschuesse-settings-actions">
                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Wird gespeichert..."
                                : "Einstellungen speichern"}
                        </button>
                    </div>
                </form>
            </section>

            {berechnung && (
                <>
                    <section className="zuschuesse-summary">
                        <div className="zuschuesse-card">
                            <span className="zuschuesse-card-title">
                                Kurzgruppen
                            </span>

                            <strong>
                                {berechnung.kurzgruppen ?? 0}
                            </strong>

                            <small>
                                {formatiereZahl(
                                    berechnung.kurzZaehlschueler
                                )}{" "}
                                Zählschüler
                            </small>

                            <p>
                                {formatiereBetrag(
                                    berechnung.kurzgruppeGesamt
                                )}
                            </p>

                            <small>
                                {formatiereBetrag(
                                    berechnung.kurzgruppeBetrag
                                )}{" "}
                                je Gruppe
                            </small>
                        </div>

                        <div className="zuschuesse-card">
                            <span className="zuschuesse-card-title">
                                Langgruppen 1–2
                            </span>

                            <strong>
                                {berechnung.langgruppen12 ?? 0}
                            </strong>

                            <small>
                                {formatiereZahl(
                                    berechnung.langZaehlschueler12
                                )}{" "}
                                Zählschüler
                            </small>

                            <p>
                                {formatiereBetrag(
                                    berechnung.langgruppe12Gesamt
                                )}
                            </p>

                            <small>
                                {formatiereBetrag(
                                    berechnung.langgruppe12Betrag
                                )}{" "}
                                je Gruppe
                            </small>
                        </div>

                        <div className="zuschuesse-card">
                            <span className="zuschuesse-card-title">
                                Langgruppen 1–4
                            </span>

                            <strong>
                                {berechnung.langgruppen14 ?? 0}
                            </strong>

                            <small>
                                {formatiereZahl(
                                    berechnung.langZaehlschueler14
                                )}{" "}
                                Zählschüler
                            </small>

                            <p>
                                {formatiereBetrag(
                                    berechnung.langgruppe14Gesamt
                                )}
                            </p>

                            <small>
                                {formatiereBetrag(
                                    berechnung.langgruppe14Betrag
                                )}{" "}
                                je Gruppe
                            </small>
                        </div>

                        <div className="zuschuesse-card">
                            <span className="zuschuesse-card-title">
                                Langgruppen 5–10
                            </span>

                            <strong>
                                {berechnung.langgruppen510 ?? 0}
                            </strong>

                            <small>
                                {formatiereZahl(
                                    berechnung.langZaehlschueler510
                                )}{" "}
                                Zählschüler
                            </small>

                            <p>
                                {formatiereBetrag(
                                    berechnung.langgruppe510Gesamt
                                )}
                            </p>

                            <small>
                                {formatiereBetrag(
                                    berechnung.langgruppe510Betrag
                                )}{" "}
                                je Gruppe
                            </small>
                        </div>

                        <div className="zuschuesse-card zuschuesse-card-total">
                            <span className="zuschuesse-card-title">
                                Gesamtzuschuss
                            </span>

                            <strong>
                                {formatiereBetrag(
                                    berechnung.gesamtZuschuss
                                )}
                            </strong>

                            <small>
                                Schuljahr{" "}
                                {berechnung.schuljahr}
                            </small>
                        </div>
                    </section>

                    <section className="zuschuesse-table-section">
                        <div className="zuschuesse-table-header">
                            <div>
                                <h2>Schülerübersicht</h2>

                                <p>
                                    Berechnungswerte pro Schüler
                                </p>
                            </div>

                            <span>
                                {berechnung.studenten?.length ?? 0}{" "}
                                Schüler
                            </span>
                        </div>

                        <div className="zuschuesse-table-wrapper">
                            <table className="zuschuesse-table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Klasse</th>
                                    <th>Jahrgang</th>
                                    <th>Kurz</th>
                                    <th>Lang</th>
                                    <th>P</th>
                                    <th>Kurz-Zähler</th>
                                    <th>Lang-Zähler</th>
                                    <th>
                                        Kurz-Zählschüler
                                    </th>
                                    <th>
                                        Lang-Zählschüler
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {berechnung.studenten?.map(
                                    (eintrag) => (
                                        <tr
                                            key={
                                                eintrag.student.id
                                            }
                                        >
                                            <td className="zuschuesse-name-cell">
                                                {
                                                    eintrag.student
                                                        .vorname
                                                }{" "}
                                                {
                                                    eintrag.student
                                                        .nachname
                                                }
                                            </td>

                                            <td>
                                                {eintrag.student
                                                    .klasse || "–"}
                                            </td>

                                            <td>
                                                {eintrag.student
                                                    .jahrgang ?? "–"}
                                            </td>

                                            <td>
                                                {
                                                    eintrag.anzahlKurzBuchungen
                                                }
                                            </td>

                                            <td>
                                                {
                                                    eintrag.anzahlLangBuchungen
                                                }
                                            </td>

                                            <td>
                                                {
                                                    eintrag.anzahlPBuchungen
                                                }
                                            </td>

                                            <td>
                                                {formatiereZahl(
                                                    eintrag.kurzZaehler
                                                )}
                                            </td>

                                            <td>
                                                {formatiereZahl(
                                                    eintrag.langZaehler
                                                )}
                                            </td>

                                            <td>
                                                {formatiereZahl(
                                                    eintrag.kurzZaehlschueler
                                                )}
                                            </td>

                                            <td>
                                                {formatiereZahl(
                                                    eintrag.langZaehlschueler
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}

                                {!berechnung.studenten?.length && (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="zuschuesse-empty"
                                        >
                                            Keine Schülerdaten
                                            vorhanden.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default ZuschuessePage;