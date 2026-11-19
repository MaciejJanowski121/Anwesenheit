import axios from 'axios';

const API_URL = '/api/gruppen-anwesenheit';


/* =====================================================
   ANA – ANWESENHEITSSTATISTIK
   ===================================================== */

export const getAnaAnwesenheitStatistik = async (
    kursId
) => {

    const response = await axios.get(

        `${API_URL}/ana/${kursId}`,

        {
            withCredentials: true
        }

    );

    return response.data;
};


/* =====================================================
   ANGEBOT – ANWESENHEITSSTATISTIK
   ===================================================== */

export const getAngebotAnwesenheitStatistik = async (
    angebotId
) => {

    const response = await axios.get(

        `${API_URL}/angebot/${angebotId}`,

        {
            withCredentials: true
        }

    );

    return response.data;
};