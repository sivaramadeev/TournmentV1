
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Tournament } from './types';
import { DEFAULT_TOURNAMENT, ADMIN_USERNAME, ADMIN_PASSWORD } from './constants';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import PlayerView from './components/PlayerView';
import Header from './components/Header';
import AdminTournamentList from './components/AdminTournamentList';
import PublicTournamentList from './components/PublicTournamentList';

export type View = 'player' | 'admin' | 'login';

const App: React.FC = () => {
    // Store array of tournaments in local storage
    const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('tournamentServiceData', []);
    
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useLocalStorage<boolean>('isAdminLoggedIn', false);
    const [currentView, setCurrentView] = useState<View>('player');
    
    // FIX: Persist the active tournament ID so refresh doesn't kick user back to list
    const [activeTournamentId, setActiveTournamentId] = useLocalStorage<string | null>('activeTournamentId', null);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ensure tournaments is always an array (recovers from potential corrupted storage)
        if (!Array.isArray(tournaments)) {
            setTournaments([]);
        }
        
        if (isAdminLoggedIn) {
            setCurrentView('admin');
        } else {
            setCurrentView('player');
        }
        setLoading(false);
    }, [isAdminLoggedIn, tournaments, setTournaments]);

    const handleLogin = useCallback((user: string, pass: string): boolean => {
        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            setIsAdminLoggedIn(true);
            setCurrentView('admin');
            // Don't reset activeTournamentId here, so if they logged in previously and refreshed, they stay put.
            return true;
        }
        return false;
    }, [setIsAdminLoggedIn]);

    const handleLogout = useCallback(() => {
        setIsAdminLoggedIn(false);
        setCurrentView('login');
        setActiveTournamentId(null);
    }, [setIsAdminLoggedIn, setActiveTournamentId]);

    const createNewTournament = (name: string) => {
        const newTournament: Tournament = {
            ...DEFAULT_TOURNAMENT,
            id: `tourn-${Date.now()}`,
            createdAt: new Date().toISOString(),
            settings: {
                ...DEFAULT_TOURNAMENT.settings,
                name: name
            }
        };
        setTournaments(prev => [...prev, newTournament]);
        setActiveTournamentId(newTournament.id);
    };

    const deleteTournament = (id: string) => {
        if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            setTournaments(prev => prev.filter(t => t.id !== id));
            if (activeTournamentId === id) setActiveTournamentId(null);
        }
    };
    
    const handleImportTournaments = (importedData: Tournament[]) => {
        setTournaments(importedData);
        alert('Data restored successfully!');
    };

    const handleUpdateActiveTournament = (
        value: Tournament | ((prev: Tournament) => Tournament)
    ) => {
        if (!activeTournamentId) return;

        setTournaments(prevList => {
            const index = prevList.findIndex(t => t.id === activeTournamentId);
            if (index === -1) return prevList;

            const oldTournament = prevList[index];
            const updatedTournament = typeof value === 'function' ? value(oldTournament) : value;

            const newList = [...prevList];
            newList[index] = updatedTournament;
            return newList;
        });
    };

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-10">Loading Application...</div>;
        }

        const activeTournament = Array.isArray(tournaments) ? tournaments.find(t => t.id === activeTournamentId) : null;

        switch (currentView) {
            case 'login':
                return <AdminLogin onLogin={handleLogin} />;
            
            case 'admin':
                if (isAdminLoggedIn) {
                    if (activeTournamentId && activeTournament) {
                        return (
                            <AdminDashboard 
                                tournament={activeTournament} 
                                setTournament={handleUpdateActiveTournament}
                                onBack={() => setActiveTournamentId(null)}
                            />
                        );
                    }
                    return (
                        <AdminTournamentList 
                            tournaments={tournaments} 
                            onCreate={createNewTournament}
                            onSelect={setActiveTournamentId}
                            onDelete={deleteTournament}
                            onImport={handleImportTournaments}
                        />
                    );
                }
                return <AdminLogin onLogin={handleLogin} />;
            
            case 'player':
            default:
                if (activeTournamentId && activeTournament) {
                    return (
                        <PlayerView 
                            tournament={activeTournament} 
                            onBack={() => setActiveTournamentId(null)}
                        />
                    );
                }
                return (
                    <PublicTournamentList 
                        tournaments={tournaments}
                        onSelect={setActiveTournamentId}
                    />
                );
        }
    };

    const currentStatus = activeTournamentId && Array.isArray(tournaments) 
        ? tournaments.find(t => t.id === activeTournamentId)?.status || 'Draft' 
        : 'Draft';

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header
                currentView={currentView}
                setCurrentView={(view) => {
                    setCurrentView(view);
                    setActiveTournamentId(null);
                }}
                isAdminLoggedIn={isAdminLoggedIn}
                onLogout={handleLogout}
                tournamentStatus={currentStatus}
            />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
