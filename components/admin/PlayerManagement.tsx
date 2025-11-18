import React, { useState, useMemo } from 'react';
import { Tournament, Player } from '../../types';
import { EditIcon, DeleteIcon } from '../icons';

interface PlayerManagementProps {
    tournament: Tournament;
    setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ tournament, setTournament }) => {
    const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
    const [playerForm, setPlayerForm] = useState({
        name: '',
        mobileNumber: '',
        categories: [] as string[],
        feePaid: false,
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setPlayerForm(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'categories') {
            const { options } = e.target as HTMLSelectElement;
            const selectedCategories: string[] = [];
            for (let i = 0, l = options.length; i < l; i++) {
                if (options[i].selected) {
                    selectedCategories.push(options[i].value);
                }
            }
             if (selectedCategories.length > 2) {
                alert("A player can be in at most 2 categories.");
                return;
            }
            setPlayerForm(prev => ({ ...prev, categories: selectedCategories }));
        } else {
            setPlayerForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForm = () => {
        setEditPlayerId(null);
        setPlayerForm({ name: '', mobileNumber: '', categories: [], feePaid: false });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerForm.name || !playerForm.mobileNumber || playerForm.categories.length === 0) {
            alert('Please fill all required fields: Name, Mobile Number, and Categories.');
            return;
        }

        setTournament(prev => {
            let updatedPlayers;
            if (editPlayerId) {
                updatedPlayers = prev.players.map(p => p.id === editPlayerId ? { ...p, ...playerForm } : p);
            } else {
                const newPlayer = { ...playerForm, id: `player-${Date.now()}` };
                updatedPlayers = [...prev.players, newPlayer];
            }
            return { ...prev, players: updatedPlayers };
        });
        resetForm();
    };

    const handleEdit = (player: Player) => {
        setEditPlayerId(player.id);
        setPlayerForm({ ...player });
    };

    const handleDelete = (playerId: string) => {
        if (window.confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
            setTournament(prev => ({ ...prev, players: prev.players.filter(p => p.id !== playerId) }));
        }
    };
    
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvData = event.target?.result as string;
            const lines = csvData.split('\n').filter(line => line.trim() !== '');
            if (lines.length <= 1) {
                alert("CSV file is empty or has only headers.");
                return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim());
            const requiredHeaders = ["Name", "MobileNumber", "Categories", "Paid(Y/N)"];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                alert(`CSV must contain headers: ${requiredHeaders.join(', ')}`);
                return;
            }

            const newPlayers: Player[] = [];
            const playersByCategory: { [key: string]: number } = {};
            tournament.players.forEach(p => {
                p.categories.forEach(c => {
                    playersByCategory[c] = (playersByCategory[c] || 0) + 1;
                });
            });

            lines.slice(1).forEach(line => {
                const values = line.split(',');
                const row = headers.reduce((obj, header, index) => {
                    obj[header] = values[index]?.trim() || '';
                    return obj;
                }, {} as {[key: string]: string});
                
                const categories = row.Categories.split('|').map(c => {
                    const cat = c.trim().replace(/\+?$/, '+');
                    return tournament.settings.categories.find(tc => tc.startsWith(cat.slice(0, -1))) || cat;
                }).filter(Boolean);

                const mobile = row.MobileNumber;

                let playerExists = false;
                for (const category of categories) {
                    if (tournament.players.some(p => p.mobileNumber === mobile && p.categories.includes(category))) {
                        playerExists = true;
                        break;
                    }
                }
                
                if (!playerExists) {
                    newPlayers.push({
                        id: `player-csv-${Date.now()}-${newPlayers.length}`,
                        name: row.Name,
                        mobileNumber: mobile,
                        categories,
                        feePaid: row['Paid(Y/N)'].toLowerCase() === 'y',
                    });
                    categories.forEach(c => {
                        playersByCategory[c] = (playersByCategory[c] || 0) + 1;
                    });
                }
            });
            
            setTournament(prev => ({ ...prev, players: [...prev.players, ...newPlayers] }));

            const categoryWarnings = Object.entries(playersByCategory)
                .filter(([, count]) => count > 50)
                .map(([cat, count]) => `${cat} (${count} players)`);
            
            if (categoryWarnings.length > 0) {
                alert(`Warning: The following categories have more than 50 players:\n${categoryWarnings.join('\n')}`);
            }
            alert(`${newPlayers.length} new players added from CSV.`);
        };
        reader.readAsText(file);
    };

    const sortedPlayers = useMemo(() => {
        return [...tournament.players].sort((a, b) => {
            if (a.mobileNumber < b.mobileNumber) return -1;
            if (a.mobileNumber > b.mobileNumber) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [tournament.players]);


    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold">2. Player Management</h2>

            {/* Add/Edit Form */}
            <form onSubmit={handleSubmit} className="p-4 border border-gray-700 rounded-md space-y-4">
                <h3 className="font-semibold">{editPlayerId ? 'Edit Player' : 'Add New Player'}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                     <input name="name" value={playerForm.name} onChange={handleFormChange} placeholder="Player Name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" required />
                     <input name="mobileNumber" value={playerForm.mobileNumber} onChange={handleFormChange} placeholder="Mobile Number" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" required/>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <select
                        name="categories"
                        multiple
                        value={playerForm.categories}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md h-24"
                    >
                         {tournament.settings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                     <div className="flex items-center">
                        <input type="checkbox" id="feePaid" name="feePaid" checked={playerForm.feePaid} onChange={handleFormChange} className="h-4 w-4 text-brand-primary bg-gray-700 border-gray-600 rounded focus:ring-brand-primary" />
                        <label htmlFor="feePaid" className="ml-2">Fee Paid</label>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button type="submit" className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md">{editPlayerId ? 'Update Player' : 'Add Player'}</button>
                    {editPlayerId && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Cancel Edit</button>}
                </div>
            </form>

            {/* CSV Upload */}
            <div className="p-4 border border-gray-700 rounded-md">
                 <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload Players from CSV</label>
                 <input id="csv-upload" type="file" accept=".csv" onChange={handleCsvUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"/>
                 <p className="text-xs text-gray-500 mt-1">Headers: Name, MobileNumber, Categories (use '|' for multiple), Paid(Y/N)</p>
            </div>

            {/* Player List */}
             <div className="overflow-x-auto">
                <h3 className="font-semibold mb-2">Registered Players</h3>
                 <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase">Mobile Number</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase">Player Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase">Categories</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase">Fee Paid</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sortedPlayers.map((player, index) => {
                            const showMobile = index === 0 || sortedPlayers[index - 1].mobileNumber !== player.mobileNumber;
                            return (
                                <tr key={player.id}>
                                    <td className="px-4 py-2 whitespace-nowrap align-middle">
                                        {showMobile ? player.mobileNumber : ''}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">{player.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{player.categories.join(', ')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{player.feePaid ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <button onClick={() => handleEdit(player)} className="p-1 text-blue-400 hover:text-blue-300"><EditIcon/></button>
                                        <button onClick={() => handleDelete(player.id)} className="p-1 text-red-400 hover:text-red-300"><DeleteIcon/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

export default PlayerManagement;