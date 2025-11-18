import React, { useState, useEffect } from 'react';
import { Tournament, TournamentSettings } from '../../types';
import { TOURNAMENT_TYPES, PLAYER_CATEGORIES } from '../../constants';

interface TournamentSetupProps {
    settings: TournamentSettings;
    setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({ settings, setTournament }) => {
    const [localSettings, setLocalSettings] = useState<TournamentSettings>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSettings({ ...localSettings, name: e.target.value });
    };

    const handleCheckboxChange = (field: 'types' | 'categories', value: string) => {
        const currentValues = localSettings[field] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setLocalSettings({ ...localSettings, [field]: newValues });
    };

    const handleSave = () => {
        setTournament(prev => ({ ...prev, settings: localSettings }));
        alert('Tournament settings saved!');
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold">1. Tournament Setup</h2>
            <div>
                <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-300">Tournament Name</label>
                <input
                    type="text"
                    id="tournamentName"
                    value={localSettings.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    placeholder="e.g., Summer Open 2024"
                />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-300">Tournament Types</h3>
                    <div className="mt-2 space-y-2">
                        {TOURNAMENT_TYPES.map(type => (
                            <div key={type} className="flex items-center">
                                <input
                                    id={`type-${type}`}
                                    type="checkbox"
                                    checked={localSettings.types.includes(type)}
                                    onChange={() => handleCheckboxChange('types', type)}
                                    className="h-4 w-4 text-brand-primary bg-gray-700 border-gray-600 rounded focus:ring-brand-primary"
                                />
                                <label htmlFor={`type-${type}`} className="ml-3 text-sm text-gray-300">{type}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-300">Player Categories</h3>
                    <div className="mt-2 space-y-2">
                        {PLAYER_CATEGORIES.map(cat => (
                            <div key={cat} className="flex items-center">
                                <input
                                    id={`cat-${cat}`}
                                    type="checkbox"
                                    checked={localSettings.categories.includes(cat)}
                                    onChange={() => handleCheckboxChange('categories', cat)}
                                    className="h-4 w-4 text-brand-primary bg-gray-700 border-gray-600 rounded focus:ring-brand-primary"
                                />
                                <label htmlFor={`cat-${cat}`} className="ml-3 text-sm text-gray-300">{cat}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-medium rounded-md shadow-sm transition-colors"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default TournamentSetup;