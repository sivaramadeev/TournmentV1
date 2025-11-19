
import React, { useState } from 'react';
import { Tournament } from '../types';
import { gistService } from '../services/gistService';

interface ShareModalProps {
    tournament: Tournament;
    onClose: () => void;
    onSyncComplete: (gistId: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ tournament, onClose, onSyncComplete }) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');

    const handleSync = async () => {
        if (!token) {
            setError('Please enter a valid GitHub Personal Access Token.');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            const gistId = await gistService.saveToGist(token, tournament, tournament.gistId);
            onSyncComplete(gistId);
            
            // Generate the link based on current location
            const baseUrl = window.location.origin + window.location.pathname;
            setGeneratedLink(`${baseUrl}?data=${gistId}`);
        } catch (err: any) {
            setError(err.message || 'An error occurred while syncing.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Sync to Cloud (GitHub)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="p-6 space-y-4">
                    {!generatedLink ? (
                        <>
                            <p className="text-sm text-gray-300">
                                To share this tournament globally, you need a <strong>GitHub Personal Access Token</strong>. 
                                This will save the data to a public Gist on your GitHub account.
                            </p>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">GitHub Token (Fine-grained or Classic with 'gist' scope)</label>
                                <input 
                                    type="password" 
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <button 
                                onClick={handleSync} 
                                disabled={loading}
                                className="w-full py-2 px-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-md font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Syncing...' : 'Sync & Generate Link'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-900/30 border border-green-600/50 p-3 rounded-md text-center">
                                <p className="text-green-400 font-bold text-lg">Sync Successful!</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Shareable Public Link</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly
                                        value={generatedLink}
                                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-300 text-sm"
                                    />
                                    <button onClick={copyToClipboard} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Send this link to players. They can view the tournament without logging in. 
                                Future updates require you to click "Sync" again using your token.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
