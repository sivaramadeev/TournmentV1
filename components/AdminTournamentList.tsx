
import React, { useState } from 'react';
import { Tournament } from '../types';
import { DeleteIcon, EditIcon, CheckCircleIcon } from './icons';

interface AdminTournamentListProps {
    tournaments: Tournament[];
    onCreate: (name: string) => void;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onImport: (data: Tournament[]) => void;
}

const AdminTournamentList: React.FC<AdminTournamentListProps> = ({ tournaments, onCreate, onSelect, onDelete, onImport }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newTournamentName, setNewTournamentName] = useState('');

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTournamentName.trim()) {
            onCreate(newTournamentName.trim());
            setNewTournamentName('');
            setIsCreating(false);
        }
    };

    const handleExportAll = () => {
        const dataStr = JSON.stringify(tournaments, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tournament_manager_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                        if (window.confirm(`This will overwrite all current data with ${json.length} tournaments from the backup. Are you sure?`)) {
                            onImport(json);
                        }
                    } else {
                        alert('Invalid backup file format.');
                    }
                } catch (err) {
                    alert('Failed to parse JSON file.');
                    console.error(err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white">Your Tournaments</h2>
                <div className="flex gap-3">
                     <button
                        onClick={handleExportAll}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md font-medium transition-colors text-sm border border-gray-600"
                        title="Download a backup of all tournament data"
                    >
                        ⬇ Backup Data
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md font-medium transition-colors text-sm border border-gray-600"
                        title="Restore data from a backup file"
                    >
                        ⬆ Restore Data
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md font-medium transition-colors"
                    >
                        + Create New Tournament
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
                    <h3 className="text-xl font-semibold mb-4">New Tournament Details</h3>
                    <form onSubmit={handleCreateSubmit} className="flex gap-4">
                        <input
                            type="text"
                            value={newTournamentName}
                            onChange={(e) => setNewTournamentName(e.target.value)}
                            placeholder="Enter Tournament Name (e.g. Winter Cup 2024)"
                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                            autoFocus
                        />
                        <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Create & Setup</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Cancel</button>
                    </form>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
                        <p className="text-gray-400 text-lg mb-4">No tournaments found.</p>
                        <p className="text-sm text-gray-500">Create a new one or Import a backup file to get started.</p>
                    </div>
                ) : (
                    tournaments.map(t => (
                        <div key={t.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:border-gray-500 transition-all overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white truncate" title={t.settings.name || 'Untitled'}>
                                        {t.settings.name || 'Untitled Tournament'}
                                    </h3>
                                    {t.isPublished ? (
                                        <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircleIcon className="w-3 h-3" /> Published
                                        </span>
                                    ) : (
                                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">Draft</span>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <p>Created: {new Date(t.createdAt).toLocaleDateString()}</p>
                                    <p>Players: {t.players.length}</p>
                                    <p>Fixtures: {t.fixtures.length} Categories</p>
                                </div>
                            </div>
                            <div className="bg-gray-750 bg-gray-900/30 p-4 flex justify-between border-t border-gray-700">
                                <button
                                    onClick={() => onSelect(t.id)}
                                    className="flex items-center gap-2 text-brand-primary hover:text-white transition-colors font-medium"
                                >
                                    <EditIcon className="w-4 h-4" /> Manage
                                </button>
                                <button
                                    onClick={() => onDelete(t.id)}
                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-medium"
                                >
                                    <DeleteIcon className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminTournamentList;
