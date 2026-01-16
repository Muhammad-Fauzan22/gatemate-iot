// =============================================================================
// GATEMATE Frontend - Guest Access Page
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGateStore } from '@/stores/gateStore';

export default function GuestAccess() {
    const navigate = useNavigate();
    const { gates } = useGateStore();
    const [selectedGate, setSelectedGate] = useState(gates[0]?.id || '');
    const [duration, setDuration] = useState(2);
    const [guestName, setGuestName] = useState('');
    const [permissions, setPermissions] = useState<string[]>(['open']);
    const [generatedPass, setGeneratedPass] = useState<{ qrUrl: string; expiresAt: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'create' | 'active'>('create');

    const handleGenerate = async () => {
        // Simulate API call
        await new Promise(r => setTimeout(r, 500));

        const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
        setGeneratedPass({
            qrUrl: `/api/v1/guest/use/demo-pass-${Date.now()}`,
            expiresAt: expiresAt.toISOString(),
        });
    };

    const handleShare = async () => {
        if (!generatedPass) return;

        const shareData = {
            title: 'GATEMATE Guest Access',
            text: `${guestName || 'Tamu'} - Akses gerbang berlaku hingga ${new Date(generatedPass.expiresAt).toLocaleString()}`,
            url: window.location.origin + generatedPass.qrUrl,
        };

        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(window.location.origin + generatedPass.qrUrl);
            alert('Link disalin ke clipboard!');
        }
    };

    const togglePermission = (perm: string) => {
        setPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        );
    };

    return (
        <div className="min-h-screen bg-dark p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                    <span className="text-xl">←</span>
                </button>
                <h1 className="text-xl font-bold text-white">Guest Access</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-3 rounded-xl font-medium ${activeTab === 'create' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
                        }`}
                >
                    ➕ Buat Baru
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-3 rounded-xl font-medium ${activeTab === 'active' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
                        }`}
                >
                    📋 Aktif (2)
                </button>
            </div>

            {activeTab === 'create' && !generatedPass && (
                <div className="space-y-6">
                    {/* Select Gate */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Pilih Gerbang</label>
                        <select
                            value={selectedGate}
                            onChange={(e) => setSelectedGate(e.target.value)}
                            className="w-full px-4 py-4 bg-surface-highlight rounded-xl text-white appearance-none"
                        >
                            {gates.map(gate => (
                                <option key={gate.id} value={gate.id}>{gate.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Guest Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Nama Tamu (Opsional)</label>
                        <input
                            type="text"
                            placeholder="Kurir JNE, Tamu, dll"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-4 py-4 bg-surface-highlight rounded-xl text-white"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Durasi Akses</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 4, 24].map(h => (
                                <button
                                    key={h}
                                    onClick={() => setDuration(h)}
                                    className={`py-3 rounded-xl font-medium ${duration === h
                                            ? 'bg-primary text-black'
                                            : 'bg-surface text-gray-400 border border-white/10'
                                        }`}
                                >
                                    {h} jam
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Izin</label>
                        <div className="space-y-2">
                            {[
                                { id: 'open', label: '🔓 Buka Gerbang', desc: 'Tamu bisa membuka gerbang' },
                                { id: 'close', label: '🔒 Tutup Gerbang', desc: 'Tamu bisa menutup gerbang' },
                            ].map(perm => (
                                <button
                                    key={perm.id}
                                    onClick={() => togglePermission(perm.id)}
                                    className={`w-full p-4 rounded-xl text-left flex items-center justify-between ${permissions.includes(perm.id)
                                            ? 'bg-primary/10 border border-primary'
                                            : 'bg-surface border border-white/10'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium text-white">{perm.label}</p>
                                        <p className="text-sm text-gray-400">{perm.desc}</p>
                                    </div>
                                    <span className={permissions.includes(perm.id) ? 'text-primary' : 'text-gray-500'}>
                                        {permissions.includes(perm.id) ? '✓' : '○'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={permissions.length === 0}
                        className="w-full py-4 bg-primary rounded-xl text-black font-bold disabled:opacity-50"
                    >
                        🎫 Generate QR Code
                    </button>
                </div>
            )}

            {activeTab === 'create' && generatedPass && (
                <div className="text-center space-y-6">
                    {/* QR Code Placeholder */}
                    <div className="bg-white p-8 rounded-2xl inline-block mx-auto">
                        <div className="w-48 h-48 bg-gray-800 flex items-center justify-center text-6xl">
                            📱
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {guestName || 'Guest'} Pass
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Berlaku hingga: {new Date(generatedPass.expiresAt).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex-1 py-4 bg-primary rounded-xl text-black font-bold"
                        >
                            📤 Share
                        </button>
                        <button
                            onClick={() => setGeneratedPass(null)}
                            className="flex-1 py-4 bg-surface rounded-xl text-white font-bold"
                        >
                            ➕ Buat Lagi
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'active' && (
                <div className="space-y-3">
                    {/* Active passes */}
                    {[
                        { name: 'Kurir JNE', expires: '14:30', uses: '0/1' },
                        { name: 'Tamu', expires: '18:00', uses: '1/3' },
                    ].map((pass, i) => (
                        <div key={i} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-white">{pass.name}</p>
                                <p className="text-sm text-gray-400">Expires: {pass.expires} • Uses: {pass.uses}</p>
                            </div>
                            <button className="text-red-400 text-sm font-medium">Revoke</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
