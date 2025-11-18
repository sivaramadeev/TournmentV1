
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
    // We now store an array of tournaments. 
    // Using a new key 'tournamentServiceData' to avoid conflicts with previous single-tournament versions.
    const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('tournamentServiceData', []);
    
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useLocalStorage<boolean>('isAdminLoggedIn', false);
    const [currentView, setCurrentView] = useState<View>('player');
    
    // ID of the tournament currently being viewed/edited. Null implies viewing the list.
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdminLoggedIn) {
            setCurrentView('admin');
        } else {
            setCurrentView('player');
        }
        setLoading(false);
    }, [isAdminLoggedIn]);

    const handleLogin = useCallback((user: string, pass: string): boolean => {
        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            setIsAdminLoggedIn(true);
            setCurrentView('admin');
            setActiveTournamentId(null); // Reset to list view on fresh login
            return true;
        }
        return false;
    }, [setIsAdminLoggedIn]);

    const handleLogout = useCallback(() => {
        setIsAdminLoggedIn(false);
        setCurrentView('login');
        setActiveTournamentId(null);
    }, [setIsAdminLoggedIn]);

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
        // Automatically open the new tournament
        setActiveTournamentId(newTournament.id);
    };

    const deleteTournament = (id: string) => {
        if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            setTournaments(prev => prev.filter(t => t.id !== id));
            if (activeTournamentId === id) setActiveTournamentId(null);
        }
    };

    // This wrapper mimics the React.Dispatch<SetStateAction<Tournament>> signature 
    // expected by the child components, but internally updates the specific tournament in the main array.
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

        const activeTournament = tournaments.find(t => t.id === activeTournamentId);

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

    const currentStatus = activeTournamentId && tournaments.find(t => t.id === activeTournamentId)?.status || 'Draft';

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header
                currentView={currentView}
                setCurrentView={(view) => {
                    setCurrentView(view);
                    // When switching main views, reset to the list (Hub)
                    setActiveTournamentId(null);
                }}
                isAdminLoggedIn={isAdminLoggedIn}
                onLogout={handleLogout}
                tournamentStatus={currentStatus} // Only relevant if activeTournamentId is set, but Header handles display logic
            />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
