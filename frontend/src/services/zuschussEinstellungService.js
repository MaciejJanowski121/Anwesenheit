import axios from "axios";

const API_URL =
    "/api/zuschuss-einstellungen";

export const getBySchuljahr = async (schuljahr) => {
    const response = await axios.get(
        `${API_URL}/schuljahr`,
        {
            params: {
                schuljahr
            }
        }
    );

    return response.data;
};

export const createEinstellung = async (daten) => {
    const response = await axios.post(API_URL, daten);
    return response.data;
};

export const updateEinstellung = async (id, daten) => {
    const response = await axios.put(
        `${API_URL}/${id}`,
        daten
    );

    return response.data;
};