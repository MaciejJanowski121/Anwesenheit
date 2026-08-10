import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import GesamtuebersichtPage from './pages/GesamtuebersichtPage';
import KursePage from './pages/KursePage';
import AnwesenheitPage from './pages/AnwesenheitPage';
import ImportPage from './pages/ImportPage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import GebuehrenPage from './pages/GebuehrenPage';
import ZuschuessePage from "./pages/ZuschuessePage";
import KursDetailsPage from './pages/KursDetailsPage';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/gesamtuebersicht" element={<GesamtuebersichtPage />} />
                    <Route path="/kurse" element={<KursePage />} />
                    <Route
                        path="/kurse/:id"
                        element={<KursDetailsPage />}
                    />
                    <Route path="/gebuehren" element={<GebuehrenPage />} />
                    <Route path="/anwesenheit" element={<AnwesenheitPage />} />
                    <Route path="/import" element={<ImportPage />} />
                    <Route path="/students/:id" element={<StudentDetailsPage />} />
                    <Route path="/zuschuesse" element={<ZuschuessePage />} />

                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
