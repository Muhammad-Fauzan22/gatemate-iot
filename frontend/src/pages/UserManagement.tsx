// =============================================================================
// GATEMATE Frontend - User Management Page
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
    avatar?: string;
}

const roleLabels: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'Owner', color: 'text-yellow-400' },
    ADMIN: { label: 'Admin', color: 'text-blue-400' },
    OPERATOR: { label: 'Operator', color: 'text-green-400' },
    VIEWER: { label: 'Viewer', color: 'text-gray-400' },
};

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'OWNER' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'ADMIN' },
        { id: '3', name: 'ART Siti', email: 'siti@example.com', role: 'OPERATOR' },
    ]);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');

    const handleInvite = async () => {
        if (!inviteEmail) return;

        // Simulate invite
        await new Promise(r => setTimeout(r, 500));
        alert(`Undangan dikirim ke ${inviteEmail}`);
        setShowInvite(false);
        setInviteEmail('');
    };

    const handleRemove = (userId: string) => {
        if (!confirm('Hapus user ini dari device?')) return;
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleChangeRole = (userId: string, newRole: string) => {
        setUsers(users.map(u =>
            u.id === userId ? { ...u, role: newRole as any } : u
        ));
    };

    return (
        <div className="min-h-screen bg-dark p-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                        <span className="text-xl">←</span>
                    </button>
                    <h1 className="text-xl font-bold text-white">Manage Users</h1>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    className="px-4 py-2 bg-primary rounded-xl text-black font-medium"
                >
                    + Invite
                </button>
            </div>

            {/* Permission Info */}
            <div className="bg-surface/50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-white mb-2">📋 Permission Levels</h3>
                <div className="text-sm space-y-1">
                    <p><span className="text-yellow-400">Owner:</span> Full control + delete device</p>
                    <p><span className="text-blue-400">Admin:</span> Control + manage users</p>
                    <p><span className="text-green-400">Operator:</span> Open/Close gate only</p>
                    <p><span className="text-gray-400">Viewer:</span> View status only</p>
                </div>
            </div>

            {/* User List */}
            <div className="space-y-3">
                {users.map(user => (
                    <div key={user.id} className="bg-surface rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-surface-highlight rounded-full flex items-center justify-center">
                                    <span className="text-lg">👤</span>
                                </div>
                                <div>
                                    <p className="font-medium text-white">{user.name}</p>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-medium ${roleLabels[user.role].color}`}>
                                {roleLabels[user.role].label}
                            </span>
                        </div>

                        {user.role !== 'OWNER' && (
                            <div className="flex gap-2">
                                <select
                                    value={user.role}
                                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-surface-highlight rounded-lg text-white text-sm appearance-none"
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="OPERATOR">Operator</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                                <button
                                    onClick={() => handleRemove(user.id)}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Invite User</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-highlight rounded-xl text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as any)}
                                    className="w-full px-4 py-3 bg-surface-highlight rounded-xl text-white appearance-none"
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="OPERATOR">Operator</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowInvite(false)}
                                className="flex-1 py-3 bg-surface-highlight rounded-xl text-white font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                className="flex-1 py-3 bg-primary rounded-xl text-black font-bold"
                            >
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
