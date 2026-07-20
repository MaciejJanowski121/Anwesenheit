import React, { useEffect, useState } from 'react';
import {
    getKurse,
    createKurs,
    updateKurs,
    deleteKurs
} from '../services/kursService';
import './KursePage.css';

const emptyKurs = {
    name: '',
    kursleitung: '',
    wochentag: '',
    uhrzeit: '',
    buchungsart: '',
    kursgebuehr: ''
};

function KursePage() {
    const [kurse, setKurse] = useState([]);
    const [filter, setFilter] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        loadKurse();
    }, []);

    const loadKurse = async () => {
        try {
            const data = await getKurse();
            setKurse(data);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredKurse = kurse.filter((kurs) => {
        const term = filter.toLowerCase();

        return (
            (kurs.name || '').toLowerCase().includes(term) ||
            (kurs.kursleitung || '').toLowerCase().includes(term) ||
            (kurs.wochentag || '').toLowerCase().includes(term) ||
            (kurs.uhrzeit || '').toLowerCase().includes(term) ||
            (kurs.buchungsart || '').toLowerCase().includes(term) ||
            String(kurs.kursgebuehr || '').toLowerCase().includes(term)
        );
    });

    const handleAdd = () => {
        const tempId = `new-${Date.now()}`;
        const newKurs = { ...emptyKurs, id: tempId };

        setKurse((prev) => [newKurs, ...prev]);
        setEditingId(tempId);
        setEditData(newKurs);
    };

    const handleEditStart = (kurs) => {
        setEditingId(kurs.id);
        setEditData({ ...kurs });
    };

    const handleEditChange = (field, value) => {
        setEditData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const createPayload = () => {
        return {
            name: editData.name || '',
            kursleitung: editData.kursleitung || '',
            wochentag: editData.wochentag || '',
            uhrzeit: editData.uhrzeit || '',
            buchungsart: editData.buchungsart || '',
            kursgebuehr:
                editData.kursgebuehr === '' ||
                editData.kursgebuehr === null ||
                editData.kursgebuehr === undefined
                    ? null
                    : Number(editData.kursgebuehr)
        };
    };

    const handleEditSave = async () => {
        try {
            let savedKurs;
            const dataToSave = createPayload();

            if (typeof editingId === 'number') {
                savedKurs = await updateKurs(editingId, dataToSave);

                setKurse((prev) =>
                    prev.map((kurs) =>
                        kurs.id === editingId ? savedKurs : kurs
                    )
                );
            } else {
                savedKurs = await createKurs(dataToSave);

                setKurse((prev) =>
                    prev.map((kurs) =>
                        kurs.id === editingId ? savedKurs : kurs
                    )
                );
            }

            setEditingId(null);
            setEditData({});
        } catch (error) {
            console.error('Fehler beim Speichern des Kurses:', error);
        }
    };

    const handleEditCancel = () => {
        if (typeof editingId !== 'number') {
            setKurse((prev) =>
                prev.filter((kurs) => kurs.id !== editingId)
            );
        }

        setEditingId(null);
        setEditData({});
    };

    const handleDelete = async (id) => {
        try {
            if (typeof id === 'number') {
                await deleteKurs(id);
            }

            setKurse((prev) =>
                prev.filter((kurs) => kurs.id !== id)
            );

            if (editingId === id) {
                setEditingId(null);
                setEditData({});
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Kurses:', error);
        }
    };

    const renderCell = (kurs, field) => {
        const isEditing = editingId === kurs.id;

        if (!isEditing) {
            if (field === 'kursgebuehr') {
                return kurs.kursgebuehr != null
                    ? `${kurs.kursgebuehr} €`
                    : '–';
            }

            return kurs[field] || '–';
        }

        return (
            <input
                className="kurs-edit-input"
                type={field === 'kursgebuehr' ? 'number' : 'text'}
                step={field === 'kursgebuehr' ? '0.01' : undefined}
                value={editData[field] ?? ''}
                onChange={(e) =>
                    handleEditChange(field, e.target.value)
                }
            />
        );
    };

    return (
        <div className="kurse-page">
            <h2>Kurse</h2>

            <div className="kurse-toolbar">
                <input
                    className="kurse-filter-input"
                    type="text"
                    placeholder="Kurs suchen..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />

                <button
                    className="btn-add"
                    onClick={handleAdd}
                >
                    + Neuer Kurs
                </button>
            </div>

            <table className="kurse-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Kursleitung</th>
                    <th>Wochentag</th>
                    <th>Uhrzeit</th>
                    <th>Buchungsart</th>
                    <th>Kursgebühr</th>
                    <th>Aktionen</th>
                </tr>
                </thead>

                <tbody>
                {filteredKurse.length === 0 ? (
                    <tr>
                        <td colSpan="7" className="empty-row">
                            Keine Kurse gefunden.
                        </td>
                    </tr>
                ) : (
                    filteredKurse.map((kurs) => (
                        <tr key={kurs.id}>
                            <td>{renderCell(kurs, 'name')}</td>
                            <td>{renderCell(kurs, 'kursleitung')}</td>
                            <td>{renderCell(kurs, 'wochentag')}</td>
                            <td>{renderCell(kurs, 'uhrzeit')}</td>
                            <td>{renderCell(kurs, 'buchungsart')}</td>
                            <td>{renderCell(kurs, 'kursgebuehr')}</td>

                            <td className="action-cell">
                                {editingId === kurs.id ? (
                                    <>
                                        <button
                                            className="btn-save"
                                            onClick={handleEditSave}
                                        >
                                            Speichern
                                        </button>

                                        <button
                                            className="btn-cancel"
                                            onClick={handleEditCancel}
                                        >
                                            Abbrechen
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEditStart(kurs)}
                                        >
                                            Bearbeiten
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(kurs.id)}
                                        >
                                            Löschen
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}

export default KursePage;