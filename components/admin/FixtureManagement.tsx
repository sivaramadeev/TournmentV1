import React, { useState, useMemo } from 'react';
import { Tournament, MatchStatus, Match, MatchHistoryEntry, Player } from '../../types';
import { HistoryIcon } from '../icons';

interface FixtureManagementProps {
    tournament: Tournament;
    setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const HistoryModal: React.FC<{ history: MatchHistoryEntry[], onClose: () => void }> = ({ history, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold">Match History</h3>
            </div>
            <div className="p-4 overflow-y-auto">
                <div className="space-y-4">
                    {history.length > 0 ? history.map((entry, index) => (
                        <div key={index} className="p-3 bg-gray-700/50 rounded-md text-sm">
                            <p><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
                            <p><strong>Changed By:</strong> {entry.changedBy}</p>
                            <p><strong>Old State:</strong> Score {entry.oldState.scoreP1}-{entry.oldState.scoreP2}, Status: {entry.oldState.status}</p>
                            <p><strong>New State:</strong> Score {entry.newState.scoreP1}-{entry.newState.scoreP2}, Status: {entry.newState.status}</p>
                            <p><strong>Reason:</strong> {entry.reason}</p>
                        </div>
                    )) : <p>No history for this match.</p>}
                </div>
            </div>
            <div className="p-4 border-t border-gray-700 text-right">
                <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white rounded-md">Close</button>
            </div>
        </div>
    </div>
);

const FixtureManagement: React.FC<FixtureManagementProps> = ({ tournament, setTournament }) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [historyModalMatch, setHistoryModalMatch] = useState<Match | null>(null);

    const playerMap = useMemo(() => new Map(tournament.players.map(p => [p.id, p])), [tournament.players]);

    const handleGenerateFixtures = () => {
        if (!selectedCategory || !selectedType) {
            alert('Please select a category and type to generate fixtures.');
            return;
        }

        const playersInCategory = tournament.players.filter(p => p.categories.includes(selectedCategory));
        if (playersInCategory.length < 4) {
            alert('A minimum of 4 players is required in a category to generate fixtures.');
            return;
        }

        let shuffledPlayers = [...playersInCategory].sort(() => 0.5 - Math.random());
        const groups: { name: string, players: Player[] }[] = [];
        let groupIndex = 1;

        while (shuffledPlayers.length >= 4) {
            let groupSize = Math.min(6, shuffledPlayers.length);
            if (shuffledPlayers.length - groupSize > 0 && shuffledPlayers.length - groupSize < 4) {
                if (shuffledPlayers.length === 7) groupSize = 4; // 4 + 3
                else if (shuffledPlayers.length === 8) groupSize = 4; // 4 + 4
                else if (shuffledPlayers.length === 9) groupSize = 5; // 5 + 4
                else if (shuffledPlayers.length === 10) groupSize = 5; // 5 + 5
                else if (shuffledPlayers.length === 11) groupSize = 5; // 5 + 6
                else groupSize = 6;
            }
            if (shuffledPlayers.length < groupSize) break;
            
            groups.push({
                name: `Group ${groupIndex++}`,
                players: shuffledPlayers.splice(0, groupSize),
            });
        }
        
        if (shuffledPlayers.length > 0) {
            alert(`Could not form a valid group for the remaining ${shuffledPlayers.length} players. Please adjust player count.`);
            return;
        }

        const newCategoryFixture = {
            category: selectedCategory,
            type: selectedType,
            groups: groups.map(group => {
                const matches: Match[] = [];
                for (let i = 0; i < group.players.length; i++) {
                    for (let j = i + 1; j < group.players.length; j++) {
                        matches.push({
                            id: `match-${Date.now()}-${i}-${j}`,
                            player1Id: group.players[i].id,
                            player2Id: group.players[j].id,
                            scoreP1: null,
                            scoreP2: null,
                            status: MatchStatus.Scheduled,
                            history: [],
                        });
                    }
                }
                return { id: `group-${Date.now()}-${group.name}`, name: group.name, playerIds: group.players.map(p => p.id), matches };
            })
        };

        setTournament(prev => {
            const otherFixtures = prev.fixtures.filter(f => !(f.category === selectedCategory && f.type === selectedType));
            return { ...prev, fixtures: [...otherFixtures, newCategoryFixture] };
        });
    };
    
     const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const customFixtures = JSON.parse(event.target?.result as string);
                // Basic validation could be added here
                setTournament(prev => ({ ...prev, fixtures: customFixtures }));
                alert('Custom fixtures uploaded successfully.');
            } catch (error) {
                alert('Invalid JSON file.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const updateMatch = (matchId: string, updates: Partial<Match>, reason: string) => {
        setTournament(prev => {
            let oldMatch: Match | undefined;
            const newFixtures = prev.fixtures.map(f => ({
                ...f,
                groups: f.groups.map(g => ({
                    ...g,
                    matches: g.matches.map(m => {
                        if (m.id === matchId) {
                            oldMatch = { ...m };
                            const newHistoryEntry: MatchHistoryEntry = {
                                timestamp: new Date().toISOString(),
                                changedBy: 'admin',
                                oldState: { scoreP1: m.scoreP1, scoreP2: m.scoreP2, status: m.status },
                                newState: { scoreP1: updates.scoreP1 ?? m.scoreP1, scoreP2: updates.scoreP2 ?? m.scoreP2, status: updates.status ?? m.status },
                                reason,
                            };
                            return { ...m, ...updates, history: [...m.history, newHistoryEntry] };
                        }
                        return m;
                    })
                }))
            }));
            return { ...prev, fixtures: newFixtures };
        });
    };
    
    const handleStatusChange = (match: Match, newStatus: MatchStatus) => {
        let updates: Partial<Match> = { status: newStatus };
        if (newStatus === MatchStatus.WalkoverP1) {
            updates = { ...updates, scoreP1: 1, scoreP2: 0, status: MatchStatus.Completed };
        } else if (newStatus === MatchStatus.WalkoverP2) {
             updates = { ...updates, scoreP1: 0, scoreP2: 1, status: MatchStatus.Completed };
        } else if (newStatus === MatchStatus.Disqualified) {
             updates = { ...updates, scoreP1: 0, scoreP2: 0, status: MatchStatus.Completed };
        } else if (newStatus === MatchStatus.Scheduled || newStatus === MatchStatus.InProgress) {
            updates = { ...updates, scoreP1: null, scoreP2: null };
        } else if (newStatus === MatchStatus.Completed) {
             if (match.scoreP1 === null || match.scoreP2 === null) {
                alert('Please enter scores before marking a match as completed.');
                return;
            }
        }
        updateMatch(match.id, updates, `Status changed to ${newStatus}`);
    };
    
    const handleScoreChange = (matchId: string, player: 'P1' | 'P2', score: string) => {
        const scoreValue = score === '' ? null : parseInt(score, 10);
        if (scoreValue !== null && isNaN(scoreValue)) return;
        
        const field = player === 'P1' ? 'scoreP1' : 'scoreP2';
        updateMatch(matchId, { [field]: scoreValue }, `Score updated for ${player}`);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold">3. Fixture & Score Management</h2>

            <div className="p-4 border border-gray-700 rounded-md space-y-4">
                 <h3 className="font-semibold">Generate/Upload Fixtures</h3>
                 <div className="grid md:grid-cols-3 gap-4">
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
                        <option value="">-- Select Category --</option>
                        {tournament.settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                     <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
                        <option value="">-- Select Type --</option>
                        {tournament.settings.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={handleGenerateFixtures} className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md">Generate Fixtures</button>
                </div>
                 <div>
                     <label htmlFor="json-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload Custom Fixtures (JSON)</label>
                     <input id="json-upload" type="file" accept=".json" onChange={handleJsonUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"/>
                 </div>
            </div>

            <div className="space-y-6">
                {tournament.fixtures.map(fixture => (
                    <div key={`${fixture.category}-${fixture.type}`}>
                        <h3 className="text-xl font-semibold my-4">{fixture.category} - {fixture.type}</h3>
                        {fixture.groups.map(group => (
                            <div key={group.id} className="mb-6">
                                <h4 className="text-lg font-bold p-2 bg-gray-700/50 rounded-t-md">{group.name}</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-700/50">
                                            <tr>
                                                <th className="px-2 py-2 text-left">Player 1</th>
                                                <th className="px-2 py-2 text-left">Player 2</th>
                                                <th className="px-2 py-2 text-center">Score</th>
                                                <th className="px-2 py-2 text-center">Status</th>
                                                <th className="px-2 py-2 text-center">History</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {group.matches.map(match => (
                                                <tr key={match.id}>
                                                    <td className="px-2 py-2">{playerMap.get(match.player1Id)?.name || 'N/A'}</td>
                                                    <td className="px-2 py-2">{playerMap.get(match.player2Id)?.name || 'N/A'}</td>
                                                    <td className="px-2 py-2">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <input type="number" value={match.scoreP1 ?? ''} onChange={(e) => handleScoreChange(match.id, 'P1', e.target.value)} className="w-12 text-center bg-gray-700 border border-gray-600 rounded-md" />
                                                            <span>-</span>
                                                            <input type="number" value={match.scoreP2 ?? ''} onChange={(e) => handleScoreChange(match.id, 'P2', e.target.value)} className="w-12 text-center bg-gray-700 border border-gray-600 rounded-md" />
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <select value={match.status} onChange={(e) => handleStatusChange(match, e.target.value as MatchStatus)} className="bg-gray-700 border border-gray-600 rounded-md p-1">
                                                            {Object.values(MatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <button onClick={() => setHistoryModalMatch(match)} className="p-1 text-gray-400 hover:text-white"><HistoryIcon /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {historyModalMatch && <HistoryModal history={historyModalMatch.history} onClose={() => setHistoryModalMatch(null)} />}
        </div>
    );
};

export default FixtureManagement;