import axios from "axios";

const API_URL = "/api/zuschuesse";

export const getZuschussBerechnung = async (schuljahr) => {
    const response = await axios.get(API_URL, {
        params: {
            schuljahr
        }
    });

    return response.data;
};

export const getStudentenZuschuesse = async () => {
    const response = await axios.get(
        `${API_URL}/studenten`
    );

    return response.data;
};

export const getStudentZuschuss = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/studenten/${studentId}`
    );

    return response.data;
};