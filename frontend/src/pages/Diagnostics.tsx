// =============================================================================
// GATEMATE Frontend - Diagnostics Page
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGateStore } from '@/stores/gateStore';

interface DiagnosticCheck {
    name: string;
    status: 'ok' | 'warning' | 'error' | 'checking';
    message: string;
}

export default function Diagnostics() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { gates } = useGateStore();
    const gate = gates.find(g => g.id === id) || gates[0];

    const [isRunning, setIsRunning] = useState(false);
    const [checks, setChecks] = useState<DiagnosticCheck[]>([
        { name: 'ESP32', status: 'ok', message: 'Device online' },
        { name: 'WiFi', status: 'ok', message: `Signal: ${gate?.sensors.wifiSignal || -45} dBm` },
        { name: 'Power', status: 'ok', message: `Voltage: ${gate?.sensors.voltage || 220}V` },
        { name: 'Motor', status: 'ok', message: `Current: ${gate?.sensors.current || 2.5}A` },
        { name: 'Temperature', status: 'ok', message: `${gate?.sensors.temperature || 32}°C` },
    ]);
    const [recommendations, setRecommendations] = useState<string[]>([]);

    const runDiagnostics = async () => {
        setIsRunning(true);
        setChecks(prev => prev.map(c => ({ ...c, status: 'checking' as const })));

        // Simulate diagnostic checks
        for (let i = 0; i < checks.length; i++) {
            await new Promise(r => setTimeout(r, 500));
            setChecks(prev => prev.map((c, idx) => {
                if (idx === i) {
                    // Random status for demo
                    const statuses: Array<'ok' | 'warning' | 'error'> = ['ok', 'ok', 'ok', 'warning'];
                    return { ...c, status: statuses[Math.floor(Math.random() * statuses.length)] };
                }
                return c;
            }));
        }

        setIsRunning(false);
    };

    const handleRestart = async () => {
        if (!confirm('Restart device? Ini akan memutus koneksi sementara.')) return;

        // Simulate restart
        alert('Perintah restart dikirim. Device akan restart dalam 5 detik.');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'checking': return '⏳';
            default: return '❓';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-dark p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                    <span className="text-xl">←</span>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">Diagnostics</h1>
                    <p className="text-sm text-gray-400">{gate?.name || 'Device'}</p>
                </div>
            </div>

            {/* Device Info Card */}
            <div className="bg-surface rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${gate?.isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                        <span className="text-2xl">{gate?.isOnline ? '📡' : '📴'}</span>
                    </div>
                    <div>
                        <p className="font-medium text-white">{gate?.name}</p>
                        <p className={`text-sm ${gate?.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                            {gate?.isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400">Firmware</p>
                        <p className="text-white">v2.0.4</p>
                    </div>
                    <div>
                        <p className="text-gray-400">IP Address</p>
                        <p className="text-white">192.168.1.100</p>
                    </div>
                    <div>
                        <p className="text-gray-400">MAC Address</p>
                        <p className="text-white">AA:BB:CC:DD:EE:FF</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Uptime</p>
                        <p className="text-white">3d 14h 22m</p>
                    </div>
                </div>
            </div>

            {/* Run Diagnostics Button */}
            <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="w-full py-4 bg-primary rounded-xl text-black font-bold mb-6 disabled:opacity-50"
            >
                {isRunning ? '🔍 Memeriksa...' : '🔍 Run System Check'}
            </button>

            {/* Check Results */}
            <div className="space-y-3 mb-6">
                {checks.map((check, i) => (
                    <div key={i} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{getStatusIcon(check.status)}</span>
                            <div>
                                <p className="font-medium text-white">{check.name}</p>
                                <p className={`text-sm ${getStatusColor(check.status)}`}>{check.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            {checks.some(c => c.status !== 'ok') && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                    <h3 className="font-medium text-yellow-400 mb-2">💡 Rekomendasi</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Periksa koneksi kabel power</li>
                        <li>• Pastikan ventilasi tidak terhalang</li>
                        <li>• Coba restart device dari menu di bawah</li>
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                <button
                    onClick={handleRestart}
                    className="w-full py-4 bg-surface border border-yellow-500/30 rounded-xl text-yellow-400 font-medium"
                >
                    🔄 Restart Device
                </button>
                <button
                    onClick={() => navigate('/settings')}
                    className="w-full py-4 bg-surface border border-white/10 rounded-xl text-gray-400 font-medium"
                >
                    ⚙️ Device Settings
                </button>
            </div>

            {/* Activity Log Preview */}
            <div className="mt-6">
                <h3 className="font-medium text-white mb-3">📋 Recent Activity</h3>
                <div className="bg-surface rounded-xl divide-y divide-white/5">
                    {[
                        { time: '14:30', action: 'Gate Opened', user: 'John' },
                        { time: '14:35', action: 'Gate Closed', user: 'John' },
                        { time: '12:00', action: 'Schedule: Auto Open', user: 'System' },
                    ].map((log, i) => (
                        <div key={i} className="p-3 flex justify-between items-center">
                            <div>
                                <p className="text-white text-sm">{log.action}</p>
                                <p className="text-gray-500 text-xs">{log.user}</p>
                            </div>
                            <p className="text-gray-400 text-sm">{log.time}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
