import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    NavLink,
    Outlet,
    useLocation
} from 'react-router-dom';

import logo from '../assets/montessori.png';

import './MainLayout.css';

/* =====================================================
   NAVIGATIONSKONFIGURATION
   ===================================================== */

const NAVIGATION = [
    {
        id: 'start',
        label: 'Startseite',
        icon: '⌂',
        adminOnly: true,
        path: '/'
    },
    {
        id: 'uebersichten',
        label: 'Übersichten',
        icon: '▤',
        adminOnly: true,
        items: [
            {
                label: 'Gesamtübersicht',
                path: '/gesamtuebersicht'
            },
            {
                label: 'Zuschüsse',
                path: '/zuschuesse'
            },
            {
                label: 'Gebühren',
                path: '/gebuehren'
            }
        ]
    },
    {
        id: 'schueler',
        label: 'Schüler & Klassen',
        icon: '♙',
        items: [
            {
                label: 'Schülerinfos',
                path: '/schuelerinfos'
            },
            {
                label: 'Klassen',
                path: '/klassen'
            },
            {
                label: 'Anwesenheit',
                path: '/anwesenheit'
            }
        ]
    },
    {
        id: 'betreuung',
        label: 'ANA & Betreuung',
        icon: '▦',
        items: [
            {
                label: 'ANA',
                path: '/kurse',
                adminOnly: true
            },
            {
                label: 'Infos ANA',
                path: '/kursinfos'
            }
        ]
    },
    {
        id: 'verwaltung',
        label: 'Verwaltung',
        icon: '⚙',
        adminOnly: true,
        items: [
            {
                label: 'Import',
                path: '/import'
            },
            {
                label: 'Benutzer',
                path: '/benutzer'
            }
        ]
    }
];

/* =====================================================
   HILFSFUNKTIONEN
   ===================================================== */

function isPathActive(currentPath, targetPath) {
    if (targetPath === '/') {
        return currentPath === '/';
    }

    return (
        currentPath === targetPath ||
        currentPath.startsWith(`${targetPath}/`)
    );
}

function MainLayout({ user, onLogout }) {

    const location = useLocation();

    const navigationRef = useRef(null);

    /* =====================================================
       THEME
       ===================================================== */

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute(
            'data-theme',
            theme
        );

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(current =>
            current === 'dark' ? 'light' : 'dark'
        );
    };

    /* =====================================================
       ROLLE
       ===================================================== */

    const isAdmin = user?.role === 'ADMIN';

    /* =====================================================
       MENÜSTATUS
       ===================================================== */

    const [openMenu, setOpenMenu] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const visibleNavigation = NAVIGATION
        .filter(group => !group.adminOnly || isAdmin)
        .map(group => ({
            ...group,
            items: group.items?.filter(
                item => !item.adminOnly || isAdmin
            )
        }))
        .filter(group =>
            group.path || (group.items && group.items.length > 0)
        );

    /* =====================================================
       MENÜ SCHLIESSEN
       ===================================================== */

    useEffect(() => {
        setOpenMenu(null);
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleOutsideClick = event => {
            if (
                navigationRef.current &&
                !navigationRef.current.contains(event.target)
            ) {
                setOpenMenu(null);
                setMobileMenuOpen(false);
            }
        };

        const handleEscape = event => {
            if (event.key === 'Escape') {
                setOpenMenu(null);
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener(
            'pointerdown',
            handleOutsideClick
        );

        document.addEventListener(
            'keydown',
            handleEscape
        );

        return () => {
            document.removeEventListener(
                'pointerdown',
                handleOutsideClick
            );

            document.removeEventListener(
                'keydown',
                handleEscape
            );
        };
    }, []);

    /* =====================================================
       MENÜ UMSCHALTEN
       ===================================================== */

    const toggleMenu = menuId => {
        setOpenMenu(current =>
            current === menuId ? null : menuId
        );
    };

    /* =====================================================
       NAVIGATION RENDERN
       ===================================================== */

    const renderNavigation = () => (
        visibleNavigation.map(group => {

            const groupActive = group.path
                ? isPathActive(location.pathname, group.path)
                : group.items.some(item =>
                    isPathActive(location.pathname, item.path)
                );

            if (group.path) {
                return (
                    <NavLink
                        key={group.id}
                        to={group.path}
                        end={group.path === '/'}
                        className={({ isActive }) =>
                            `nav-main-link ${isActive ? 'active' : ''}`
                        }
                        onClick={() => {
                            setOpenMenu(null);
                            setMobileMenuOpen(false);
                        }}
                    >
                        <span className="nav-item-icon" aria-hidden="true">
                            {group.icon}
                        </span>

                        <span>{group.label}</span>
                    </NavLink>
                );
            }

            const expanded = openMenu === group.id;

            return (
                <div
                    key={group.id}
                    className={`nav-dropdown ${expanded ? 'open' : ''}`}
                >
                    <button
                        type="button"
                        className={
                            `nav-dropdown-trigger ${
                                groupActive ? 'active' : ''
                            }`
                        }
                        aria-expanded={expanded}
                        aria-controls={`nav-menu-${group.id}`}
                        onClick={() => toggleMenu(group.id)}
                    >
                        <span
                            className="nav-item-icon"
                            aria-hidden="true"
                        >
                            {group.icon}
                        </span>

                        <span>{group.label}</span>

                        <span
                            className={`nav-chevron ${
                                expanded ? 'rotated' : ''
                            }`}
                            aria-hidden="true"
                        >
                            ▾
                        </span>
                    </button>

                    {expanded && (
                        <div
                            id={`nav-menu-${group.id}`}
                            className="nav-dropdown-menu"
                        >
                            {group.items.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-dropdown-link ${
                                            isActive ? 'active' : ''
                                        }`
                                    }
                                    onClick={() => {
                                        setOpenMenu(null);
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
            );
        })
    );

    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <div className="app-layout">

            <header className="app-header">

                <div className="header-brand">
                    <img
                        src={logo}
                        alt="Montessori Logo"
                        className="header-logo"
                    />

                    <h1 className="header-title">
                        Anwesenheitsliste
                    </h1>
                </div>

                <div className="header-actions">

                    <div className="header-user">
                        <div>{user?.username}</div>

                        <div className="header-user-role">
                            {isAdmin
                                ? 'Administrator'
                                : 'Anwender'}
                        </div>
                    </div>

                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        type="button"
                        title={
                            theme === 'dark'
                                ? 'Helles Design'
                                : 'Dunkles Design'
                        }
                        aria-label="Design wechseln"
                    >
                        <span className="theme-icon">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </span>

                        <span className="theme-text">
                            {theme === 'dark' ? 'Hell' : 'Dunkel'}
                        </span>
                    </button>

                    <button
                        className="theme-toggle"
                        onClick={onLogout}
                        type="button"
                        title="Abmelden"
                    >
                        Abmelden
                    </button>

                </div>

            </header>

            {/* NAVIGATION */}

            <div
                className="main-nav-wrapper"
                ref={navigationRef}
            >
                <button
                    type="button"
                    className="mobile-nav-toggle"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="main-navigation"
                    onClick={() => {
                        setMobileMenuOpen(current => !current);
                        setOpenMenu(null);
                    }}
                >
                    <span aria-hidden="true">
                        {mobileMenuOpen ? '✕' : '☰'}
                    </span>

                    <span>Menü</span>
                </button>

                <nav
                    id="main-navigation"
                    className={`main-nav ${
                        mobileMenuOpen ? 'mobile-open' : ''
                    }`}
                    aria-label="Hauptnavigation"
                >
                    {renderNavigation()}
                </nav>
            </div>

            {/* HAUPTINHALT */}

            <main className="app-main">
                <div className="app-content">
                    <Outlet />
                </div>
            </main>

        </div>
    );
}

export default MainLayout;