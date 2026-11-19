import React, { useState } from 'react';

import AnwesenheitErfassung
    from '../components/anwesenheit/AnwesenheitErfassung';

import AnwesenheitVerlauf
    from '../components/anwesenheit/AnwesenheitVerlauf';

import './AnwesenheitPage.css';

/* =====================================================
   ANWESENHEIT PAGE
   ===================================================== */

function AnwesenheitPage({
                             isAdmin = false
                         }) {

    const [activeTab, setActiveTab] =
        useState('erfassen');

    /* =====================================================
       TAB WECHSELN
       ===================================================== */

    const handleTabChange = tab => {

        if (tab === activeTab) {
            return;
        }

        const confirmed = window.confirm(
            'Bitte stellen Sie sicher, dass alle Änderungen gespeichert sind. Möchten Sie die Ansicht wechseln?'
        );

        if (confirmed) {
            setActiveTab(tab);
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="anwesenheit-page">

            {/* PAGE HEADER */}

            <div className="page-header">

                <div className="page-header-content">

                    <h1>
                        Anwesenheit
                    </h1>

                    <p>
                        Anwesenheiten erfassen,
                        verwalten und auswerten
                    </p>

                </div>

            </div>

            {/* TABS */}

            <div className="anwesenheit-tabs">

                <button
                    type="button"
                    className={
                        activeTab === 'erfassen'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() =>
                        handleTabChange('erfassen')
                    }
                >

                    Anwesenheit erfassen

                </button>

                <button
                    type="button"
                    className={
                        activeTab === 'verlauf'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() =>
                        handleTabChange('verlauf')
                    }
                >

                    Verlauf

                </button>

            </div>

            {/* ANWESENHEIT ERFASSEN */}

            {activeTab === 'erfassen' && (

                <AnwesenheitErfassung />

            )}

            {/* ANWESENHEITSVERLAUF */}

            {activeTab === 'verlauf' && (

                <AnwesenheitVerlauf
                    isAdmin={isAdmin}
                />

            )}

        </div>
    );
}

export default AnwesenheitPage;