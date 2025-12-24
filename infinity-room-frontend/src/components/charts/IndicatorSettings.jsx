// src/components/charts/IndicatorSettings.jsx
// Settings modal for configuring trading indicators (TradingView style)
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

const ColorPicker = ({ value, onChange, label }) => (
    <div className="flex items-center gap-sm">
        <label className="text-sm text-muted" style={{ minWidth: '80px' }}>{label}</label>
        <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: '32px',
                height: '24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: 'transparent',
            }}
        />
        <span className="text-sm text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
);

const NumberInput = ({ value, onChange, label, min, max, step = 1 }) => (
    <div className="flex items-center gap-sm">
        <label className="text-sm text-muted" style={{ minWidth: '80px' }}>{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="input"
            style={{ width: '80px', padding: '4px 8px' }}
        />
    </div>
);

const Toggle = ({ value, onChange, label }) => (
    <div className="flex items-center gap-sm">
        <label className="text-sm text-muted" style={{ minWidth: '80px' }}>{label}</label>
        <button
            onClick={() => onChange(!value)}
            style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                background: value ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    top: '2px',
                    left: value ? '20px' : '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s',
                }}
            />
        </button>
    </div>
);

const SelectInput = ({ value, onChange, label, options }) => (
    <div className="flex items-center gap-sm">
        <label className="text-sm text-muted" style={{ minWidth: '80px' }}>{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input select"
            style={{ width: 'auto', padding: '4px 8px' }}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const IndicatorSection = ({ title, enabled, onToggle, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            marginBottom: '8px',
            overflow: 'hidden',
        }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-sm">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(!enabled);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        {enabled ? (
                            <Eye size={16} color="var(--accent-primary)" />
                        ) : (
                            <EyeOff size={16} color="rgba(255,255,255,0.3)" />
                        )}
                    </button>
                    <span className="text-sm" style={{ fontWeight: 500 }}>{title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const IndicatorSettings = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) return null;

    const updateSetting = (key, subKey, value) => {
        const newSettings = { ...settings };
        if (subKey) {
            newSettings[key] = { ...newSettings[key], [subKey]: value };
        } else {
            newSettings[key] = value;
        }
        onSettingsChange(newSettings);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        width: '400px',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div className="flex items-center gap-sm">
                            <Settings size={18} />
                            <span style={{ fontWeight: 600 }}>Configuración de Indicadores</span>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px', maxHeight: '60vh', overflowY: 'auto' }}>

                        {/* EMA */}
                        <IndicatorSection
                            title="EMA (Media Móvil Exponencial)"
                            enabled={settings.ema.enabled}
                            onToggle={(v) => updateSetting('ema', 'enabled', v)}
                            defaultOpen
                        >
                            <SelectInput
                                label="Período"
                                value={settings.ema.length}
                                onChange={(v) => updateSetting('ema', 'length', Number(v))}
                                options={[
                                    { value: 12, label: '12 (Rápida)' },
                                    { value: 15, label: '15 (Default)' },
                                    { value: 26, label: '26 (Lenta)' },
                                ]}
                            />
                            <ColorPicker
                                label="Color"
                                value={settings.ema.color}
                                onChange={(v) => updateSetting('ema', 'color', v)}
                            />
                            <NumberInput
                                label="Grosor"
                                value={settings.ema.lineWidth}
                                onChange={(v) => updateSetting('ema', 'lineWidth', v)}
                                min={1}
                                max={5}
                            />
                            <Toggle
                                label="Escalera"
                                value={settings.ema.stepMode}
                                onChange={(v) => updateSetting('ema', 'stepMode', v)}
                            />
                        </IndicatorSection>

                        {/* HFT Combo */}
                        <IndicatorSection
                            title="HFT (EMA + VWAP + TSR)"
                            enabled={settings.hft.enabled}
                            onToggle={(v) => updateSetting('hft', 'enabled', v)}
                        >
                            <NumberInput
                                label="EMA Período"
                                value={settings.hft.ema.length}
                                onChange={(v) => updateSetting('hft', 'ema', { ...settings.hft.ema, length: v })}
                                min={1}
                                max={100}
                            />
                            <Toggle
                                label="VWAP"
                                value={settings.hft.vwap.enabled}
                                onChange={(v) => updateSetting('hft', 'vwap', { ...settings.hft.vwap, enabled: v })}
                            />
                            <Toggle
                                label="Pivots"
                                value={settings.hft.pivots.enabled}
                                onChange={(v) => updateSetting('hft', 'pivots', { ...settings.hft.pivots, enabled: v })}
                            />
                        </IndicatorSection>

                        {/* Market Structure */}
                        <IndicatorSection
                            title="Market Structure (HH/HL/LL/LH)"
                            enabled={settings.marketStructure.enabled}
                            onToggle={(v) => updateSetting('marketStructure', 'enabled', v)}
                        >
                            <NumberInput
                                label="Swing Size"
                                value={settings.marketStructure.swingSize}
                                onChange={(v) => updateSetting('marketStructure', 'swingSize', v)}
                                min={5}
                                max={50}
                            />
                            <Toggle
                                label="Swings"
                                value={settings.marketStructure.showSwings}
                                onChange={(v) => updateSetting('marketStructure', 'showSwings', v)}
                            />
                            <Toggle
                                label="BOS"
                                value={settings.marketStructure.showBOS}
                                onChange={(v) => updateSetting('marketStructure', 'showBOS', v)}
                            />
                            <Toggle
                                label="CHoCH"
                                value={settings.marketStructure.showCHoCH}
                                onChange={(v) => updateSetting('marketStructure', 'showCHoCH', v)}
                            />
                            <ColorPicker
                                label="Color BOS"
                                value={settings.marketStructure.bosColor}
                                onChange={(v) => updateSetting('marketStructure', 'bosColor', v)}
                            />
                        </IndicatorSection>

                        {/* Pivots */}
                        <IndicatorSection
                            title="Pivotes (Soporte/Resistencia)"
                            enabled={settings.pivots.enabled}
                            onToggle={(v) => updateSetting('pivots', 'enabled', v)}
                            defaultOpen
                        >
                            <SelectInput
                                label="Período"
                                value={settings.pivots.period}
                                onChange={(v) => updateSetting('pivots', 'period', Number(v))}
                                options={[
                                    { value: 100, label: '100 min' },
                                    { value: 400, label: '400 min' },
                                    { value: 800, label: '800 min' },
                                ]}
                            />
                            <ColorPicker
                                label="Resistencia"
                                value={settings.pivots.resistanceColor}
                                onChange={(v) => updateSetting('pivots', 'resistanceColor', v)}
                            />
                            <ColorPicker
                                label="Soporte"
                                value={settings.pivots.supportColor}
                                onChange={(v) => updateSetting('pivots', 'supportColor', v)}
                            />
                            <NumberInput
                                label="Grosor"
                                value={settings.pivots.lineWidth}
                                onChange={(v) => updateSetting('pivots', 'lineWidth', v)}
                                min={1}
                                max={5}
                            />
                        </IndicatorSection>

                        {/* RSI */}
                        <IndicatorSection
                            title="RSI (Índice de Fuerza Relativa)"
                            enabled={settings.rsi.enabled}
                            onToggle={(v) => updateSetting('rsi', 'enabled', v)}
                        >
                            <NumberInput
                                label="Período"
                                value={settings.rsi.length}
                                onChange={(v) => updateSetting('rsi', 'length', v)}
                                min={2}
                                max={50}
                            />
                            <NumberInput
                                label="Sobrecompra"
                                value={settings.rsi.overbought}
                                onChange={(v) => updateSetting('rsi', 'overbought', v)}
                                min={50}
                                max={100}
                            />
                            <NumberInput
                                label="Sobreventa"
                                value={settings.rsi.oversold}
                                onChange={(v) => updateSetting('rsi', 'oversold', v)}
                                min={0}
                                max={50}
                            />
                            <ColorPicker
                                label="Color"
                                value={settings.rsi.color}
                                onChange={(v) => updateSetting('rsi', 'color', v)}
                            />
                        </IndicatorSection>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default IndicatorSettings;
