import React, { useState } from 'react';
import StudentTable from '../components/StudentTable';
import './GesamtuebersichtPage.css';

const initialStudents = [
    {
        id: 1,
        name: "Max Mustermann",
        jahrgang: 5,
        klasse: "5A",
        klassenkuerzel: "5A",
        mittagessen: true,
        gehtUm1530: false,
        rueckmeldung: "Ja",
        anaBuchung: "Montag",
        email1: "max@test.de",
        email2: "eltern@test.de",
    },
    {
        id: 2,
        name: "Anna Schmidt",
        jahrgang: 3,
        klasse: "3B",
        klassenkuerzel: "3B",
        mittagessen: false,
        gehtUm1530: true,
        rueckmeldung: "Nein",
        anaBuchung: "Dienstag",
        email1: "anna@test.de",
        email2: "familie@test.de",
    },
    {
        id: 3,
        name: "Lukas Weber",
        jahrgang: 4,
        klasse: "4C",
        klassenkuerzel: "4C",
        mittagessen: true,
        gehtUm1530: true,
        rueckmeldung: "Ja",
        anaBuchung: "Mittwoch",
        email1: "lukas@test.de",
        email2: "weber@test.de",
    },
    {
        id: 4,
        name: "Sophie Braun",
        jahrgang: 6,
        klasse: "6A",
        klassenkuerzel: "6A",
        mittagessen: true,
        gehtUm1530: false,
        rueckmeldung: "Ja",
        anaBuchung: "Donnerstag",
        email1: "sophie@test.de",
        email2: "braun@test.de",
    },
];

const emptyStudent = {
    name: "",
    jahrgang: "",
    klasse: "",
    klassenkuerzel: "",
    mittagessen: false,
    gehtUm1530: false,
    rueckmeldung: "",
    anaBuchung: "",
    email1: "",
    email2: "",
};

function GesamtuebersichtPage() {
    const [students, setStudents] = useState(initialStudents);
    const [filter, setFilter] = useState('');
    const [sortKey, setSortKey] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // --- Filtering ---
    const filtered = students.filter((s) => {
        if (!filter) return true;
        const term = filter.toLowerCase();
        return (
            s.name.toLowerCase().includes(term) ||
            s.klasse.toLowerCase().includes(term) ||
            s.klassenkuerzel.toLowerCase().includes(term) ||
            s.email1.toLowerCase().includes(term) ||
            s.email2.toLowerCase().includes(term) ||
            s.rueckmeldung.toLowerCase().includes(term) ||
            s.anaBuchung.toLowerCase().includes(term) ||
            String(s.jahrgang).includes(term)
        );
    });

    // --- Sorting ---
    const sorted = [...filtered].sort((a, b) => {
        if (!sortKey) return 0;
        let valA = a[sortKey];
        let valB = b[sortKey];
        if (typeof valA === 'boolean') {
            valA = valA ? 1 : 0;
            valB = valB ? 1 : 0;
        }
        if (typeof valA === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // --- Editing ---
    const handleEditStart = (student) => {
        setEditingId(student.id);
        setEditData({ ...student });
    };

    const handleEditChange = (key, value) => {
        setEditData((prev) => ({ ...prev, [key]: value }));
    };

    const handleEditSave = () => {
        setStudents((prev) =>
            prev.map((s) => (s.id === editingId ? { ...s, ...editData } : s))
        );
        setEditingId(null);
        setEditData({});
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditData({});
    };

    // --- Adding ---
    const handleAdd = () => {
        const newId = students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
        const newStudent = { ...emptyStudent, id: newId };
        setStudents((prev) => [...prev, newStudent]);
        setEditingId(newId);
        setEditData({ ...newStudent });
    };

    // --- Deleting ---
    const handleDelete = (id) => {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setEditData({});
        }
    };

    return (
        <div className="gesamtuebersicht-page">
            <h2>Gesamtübersicht</h2>

            <div className="table-toolbar">
                <input
                    className="filter-input"
                    type="text"
                    placeholder="Suche (Name, Klasse, Email …)"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <button className="btn-add" onClick={handleAdd}>
                    + Neuer Eintrag
                </button>
            </div>

            <StudentTable
                students={sorted}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                editingId={editingId}
                editData={editData}
                onEditStart={handleEditStart}
                onEditChange={handleEditChange}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onDelete={handleDelete}
            />
        </div>
    );
}

export default GesamtuebersichtPage;
