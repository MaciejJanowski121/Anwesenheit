import React from 'react';
import GesamtuebersichtPage from './pages/GesamtuebersichtPage';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>Anwesenheitsliste</h1>
            </header>
            <main>
                <GesamtuebersichtPage />
            </main>
        </div>
    );
}

export default App;
