import axios from 'axios';

const API_URL = '/api/anwesenheitszeiten';

/* =====================================================
   ANWESENHEITSZEITEN LADEN
   ===================================================== */

export const getAnwesenheitszeiten = async (

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

    const response = await axios.get(

        API_URL,

        {
            params
        }
    );

    return response.data;
};