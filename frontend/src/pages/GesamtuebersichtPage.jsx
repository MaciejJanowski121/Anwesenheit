import React, {useEffect, useState} from 'react';

import StudentTable from '../components/StudentTable';

import {
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent
} from '../services/studentService';

import './GesamtuebersichtPage.css';

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

    const [students, setStudents] = useState([]);

    const [filter, setFilter] = useState('');

    const [sortKey, setSortKey] = useState(null);

    const [sortDirection, setSortDirection] = useState('asc');

    const [editingId, setEditingId] = useState(null);

    const [editData, setEditData] = useState({});

    useEffect(() => {

        getStudents()

            .then((data) => setStudents(data))

            .catch((error) =>

                console.error("Fehler beim Laden der Schüler:", error));

    }, []);

    const filtered = students.filter((s) => {

        if (!filter) return true;

        const term = filter.toLowerCase();

        return (

            (s.name || "").toLowerCase().includes(term) ||

            (s.klasse || "").toLowerCase().includes(term) ||

            (s.klassenkuerzel || "").toLowerCase().includes(term) ||

            (s.email1 || "").toLowerCase().includes(term) ||

            (s.email2 || "").toLowerCase().includes(term) ||

            (s.rueckmeldung || "").toLowerCase().includes(term) ||

            (s.anaBuchung || "").toLowerCase().includes(term) ||

            String(s.jahrgang || "").includes(term)

        );

    });

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

        const strA = String(valA || "").toLowerCase();

        const strB = String(valB || "").toLowerCase();

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

    const handleEditStart = (student) => {

        setEditingId(student.id);

        setEditData({...student});

    };

    const handleEditChange = (key, value) => {

        setEditData((prev) => ({...prev, [key]: value}));

    };

    const handleEditSave = async () => {
        let savedStudent;

        if (typeof editingId === "number") {
            savedStudent = await updateStudent(editingId, editData);
        } else {
            savedStudent = await createStudent(editData);
        }

        setStudents((prev) =>
            prev.map((s) => (s.id === editingId ? savedStudent : s))
        );

        setEditingId(null);
        setEditData({});
    };



    const handleEditCancel = () => {

        setEditingId(null);

        setEditData({});

    };
    const handleAdd = () => {
        const tempId = `new-${Date.now()}`;
        const newStudent = { ...emptyStudent, id: tempId };

        setStudents((prev) => [...prev, newStudent]);
        setEditingId(tempId);
        setEditData(emptyStudent);
    };

    const handleDelete = async (id) => {
        if (typeof id === "number") {
            await deleteStudent(id);
        }

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