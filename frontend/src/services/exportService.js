import axios from 'axios';

const API_URL = '/api/exporte';

const PDF_TYPE = 'application/pdf';

const EXCEL_TYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';


/* =====================================================
   DATEINAME AUS RESPONSE LESEN
   ===================================================== */

const getFilename = (headers, fallbackFilename) => {

    const disposition =
        headers['content-disposition'];

    if (!disposition) {
        return fallbackFilename;
    }

    const utf8Match =
        disposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (utf8Match) {

        try {
            return decodeURIComponent(utf8Match[1]);
        } catch {
            return fallbackFilename;
        }
    }

    const filenameMatch =
        disposition.match(/filename="?([^";]+)"?/i);

    return filenameMatch
        ? filenameMatch[1]
        : fallbackFilename;
};


/* =====================================================
   FEHLERMELDUNG LESEN
   ===================================================== */

const getExportError = async (error) => {

    const response = error.response;

    if (response?.status === 401) {
        return 'Bitte melden Sie sich erneut an.';
    }

    if (response?.status === 403) {
        return 'Sie haben keine Berechtigung für diesen Export.';
    }

    if (response?.data instanceof Blob) {

        try {

            const text = await response.data.text();

            const data = JSON.parse(text);

            return data.message ||
                data.detail ||
                'Der Export konnte nicht erstellt werden.';

        } catch {
            // Keine JSON-Fehlermeldung vorhanden.
        }
    }

    return response?.data?.message ||
        response?.data?.detail ||
        error.message ||
        'Der Export konnte nicht erstellt werden.';
};


/* =====================================================
   ALLGEMEINER DATEI DOWNLOAD
   ===================================================== */

const downloadExport = async (

    endpoint,

    params,

    fallbackFilename,

    expectedContentType

) => {

    try {

        const response = await axios.get(

            `${API_URL}${endpoint}`,

            {
                params,

                responseType: 'blob',

                withCredentials: true
            }
        );

        const contentType =
            response.headers['content-type'] ||
            response.data.type ||
            '';

        if (
            !contentType.includes(expectedContentType) &&
            !contentType.includes('application/octet-stream')
        ) {

            throw new Error(
                'Der Server hat keine gültige Exportdatei zurückgegeben.'
            );
        }

        const filename = getFilename(

            response.headers,

            fallbackFilename
        );

        const blob = new Blob(

            [response.data],

            {
                type: expectedContentType
            }
        );

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;

        link.download = filename;

        document.body.appendChild(link);

        try {

            link.click();

        } finally {

            link.remove();

            setTimeout(() => {

                window.URL.revokeObjectURL(url);

            }, 1000);
        }

        return filename;

    } catch (error) {

        const message =
            await getExportError(error);

        throw new Error(message);
    }
};


/* =====================================================
   AKTUELLES DATUM
   ===================================================== */

const getToday = () => {

    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
};


/* =====================================================
   1. ABWESENHEITSLISTE PDF
   ===================================================== */

export const exportAbwesenheitPdf = (datum) => {

    return downloadExport(

        '/abwesenheit',

        {
            datum
        },

        `Abwesenheitsliste_${datum}.pdf`,

        PDF_TYPE
    );
};


/* =====================================================
   2. ANA-BUCHUNGEN PDF
   ===================================================== */

export const exportAnaBuchungenPdf = () => {

    return downloadExport(

        '/ana-buchungen',

        {},

        `ANA_Buchungen_${getToday()}.pdf`,

        PDF_TYPE
    );
};


/* =====================================================
   3. ANGEBOTSBUCHUNGEN PDF
   ===================================================== */

export const exportAngebotBuchungenPdf = () => {

    return downloadExport(

        '/angebot-buchungen',

        {},

        `Angebotsbuchungen_${getToday()}.pdf`,

        PDF_TYPE
    );
};


/* =====================================================
   4. SCHÜLERBUCHUNGEN PDF
   ===================================================== */

export const exportSchuelerBuchungenPdf = () => {

    return downloadExport(

        '/schueler-buchungen',

        {},

        `Schuelerbuchungen_${getToday()}.pdf`,

        PDF_TYPE
    );
};


/* =====================================================
   5. ANWESENHEITSVERLAUF EXCEL
   ===================================================== */

export const exportAnwesenheitsverlaufExcel = (

    von,

    bis,

    filterTyp = 'ALLE',

    filterId = null

) => {

    const params = {

        von,

        bis,

        filterTyp
    };

    if (
        filterTyp !== 'ALLE' &&
        filterId !== null &&
        filterId !== ''
    ) {

        params.filterId = filterId;
    }

    return downloadExport(

        '/anwesenheitsverlauf',

        params,

        `Anwesenheitsverlauf_${von}_${bis}.xlsx`,

        EXCEL_TYPE
    );
};


/* =====================================================
   6. ANWESENHEITSZEITEN EXCEL
   ===================================================== */

export const exportAnwesenheitszeitenExcel = (

    datum,

    filterTyp = 'ALLE',

    filterId = null

) => {

    const params = {

        datum,

        filterTyp
    };

    if (
        filterTyp !== 'ALLE' &&
        filterId !== null &&
        filterId !== ''
    ) {

        params.filterId = filterId;
    }

    return downloadExport(

        '/anwesenheitszeiten',

        params,

        `Anwesenheitszeiten_${datum}.xlsx`,

        EXCEL_TYPE
    );
};


/* =====================================================
   7. ANA-ANWESENHEITSARCHIV EXCEL
   ===================================================== */

export const exportAnaArchivExcel = (

    von,

    bis,

    filterTyp = 'ALLE',

    filterId = null

) => {

    const params = {

        von,

        bis,

        filterTyp
    };

    if (
        filterTyp !== 'ALLE' &&
        filterId !== null &&
        filterId !== ''
    ) {

        params.filterId = filterId;
    }

    return downloadExport(

        '/ana-archiv',

        params,

        `ANA_Anwesenheitsarchiv_${filterTyp}_${von}_bis_${bis}.xlsx`,

        EXCEL_TYPE
    );
};