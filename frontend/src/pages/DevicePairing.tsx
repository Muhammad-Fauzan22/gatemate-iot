// =============================================================================
// GATEMATE Frontend - Device Pairing Page
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DiscoveredDevice {
    deviceId: string;
    name: string;
    ip: string;
    paired: boolean;
}

export default function DevicePairing() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'scan' | 'manual' | 'connecting' | 'success'>('scan');
    const [ipAddress, setIpAddress] = useState('');
    const [pairingCode, setPairingCode] = useState('');
    const [deviceName, setDeviceName] = useState('My Gate');
    const [error, setError] = useState('');
    const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);

    const handleScan = async () => {
        // Simulate device discovery
        setDiscoveredDevices([
            { deviceId: 'GATEMATE-001', name: 'GATEMATE Device', ip: '192.168.1.100', paired: false },
        ]);
    };

    const handlePairByIP = async () => {
        if (!ipAddress) {
            setError('Masukkan alamat IP device');
            return;
        }

        setStep('connecting');
        setError('');

        try {
            // Simulate pairing
            await new Promise(r => setTimeout(r, 2000));
            setStep('success');
        } catch {
            setError('Gagal terhubung ke device');
            setStep('manual');
        }
    };

    const handlePairByCode = async () => {
        if (!pairingCode) {
            setError('Masukkan kode pairing');
            return;
        }

        setStep('connecting');
        setError('');

        try {
            await new Promise(r => setTimeout(r, 2000));
            setStep('success');
        } catch {
            setError('Kode pairing tidak valid');
            setStep('scan');
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-5xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Device Terhubung!</h2>
                    <p className="text-gray-400 mb-8">{deviceName} berhasil ditambahkan</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-primary rounded-xl text-black font-bold"
                    >
                        Ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'connecting') {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <h2 className="text-xl font-bold text-white">Menghubungkan...</h2>
                    <p className="text-gray-400">Mohon tunggu</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                    <span className="text-xl">←</span>
                </button>
                <h1 className="text-xl font-bold text-white">Tambah Device</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setStep('scan')}
                    className={`flex-1 py-3 rounded-xl font-medium ${step === 'scan' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
                        }`}
                >
                    🔍 Scan
                </button>
                <button
                    onClick={() => setStep('manual')}
                    className={`flex-1 py-3 rounded-xl font-medium ${step === 'manual' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
                        }`}
                >
                    ⌨️ Manual
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {step === 'scan' && (
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm mb-4">
                        Pastikan device GATEMATE sudah terhubung ke jaringan WiFi yang sama dengan HP Anda.
                    </p>

                    <button
                        onClick={handleScan}
                        className="w-full py-4 bg-surface rounded-xl text-white font-medium flex items-center justify-center gap-2"
                    >
                        <span>🔍</span> Scan Jaringan
                    </button>

                    {discoveredDevices.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Device Ditemukan</h3>
                            {discoveredDevices.map((device) => (
                                <button
                                    key={device.deviceId}
                                    onClick={() => {
                                        setIpAddress(device.ip);
                                        handlePairByIP();
                                    }}
                                    className="w-full p-4 bg-surface rounded-xl flex items-center justify-between mb-2"
                                >
                                    <div>
                                        <p className="text-white font-medium">{device.name}</p>
                                        <p className="text-gray-400 text-sm">{device.ip}</p>
                                    </div>
                                    <span className="text-primary">→</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-surface/50 rounded-xl">
                        <p className="text-sm text-gray-400 mb-2">Punya kode pairing?</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Masukkan kode"
                                value={pairingCode}
                                onChange={(e) => setPairingCode(e.target.value)}
                                className="flex-1 px-4 py-3 bg-surface-highlight rounded-xl text-white"
                            />
                            <button
                                onClick={handlePairByCode}
                                className="px-6 py-3 bg-primary rounded-xl text-black font-medium"
                            >
                                Pair
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'manual' && (
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm mb-4">
                        Masukkan alamat IP device GATEMATE. Anda bisa menemukannya di halaman router atau di layar device.
                    </p>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Alamat IP Device</label>
                        <input
                            type="text"
                            placeholder="192.168.1.100"
                            value={ipAddress}
                            onChange={(e) => setIpAddress(e.target.value)}
                            className="w-full px-4 py-4 bg-surface-highlight rounded-xl text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Nama Device</label>
                        <input
                            type="text"
                            placeholder="Gerbang Utama"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="w-full px-4 py-4 bg-surface-highlight rounded-xl text-white"
                        />
                    </div>

                    <button
                        onClick={handlePairByIP}
                        className="w-full py-4 bg-primary rounded-xl text-black font-bold mt-4"
                    >
                        Hubungkan Device
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-surface rounded-xl">
                <h3 className="font-medium text-white mb-3">📖 Cara Setup Device Baru</h3>
                <ol className="text-sm text-gray-400 space-y-2">
                    <li>1. Hidupkan device GATEMATE</li>
                    <li>2. Hubungkan HP ke WiFi "GATEMATE-SETUP"</li>
                    <li>3. Password: setup12345</li>
                    <li>4. Buka browser → 192.168.4.1</li>
                    <li>5. Masukkan WiFi rumah Anda</li>
                    <li>6. Kembali ke sini dan scan</li>
                </ol>
            </div>
        </div>
    );
}
