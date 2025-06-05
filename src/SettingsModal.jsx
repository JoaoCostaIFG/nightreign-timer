import React, { useState } from "react";

const DEFAULT_VOICES = ["Ranni", "Miquella", "Malenia"];

export default function SettingsModal({ open, onClose, settings, setSettings }) {
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local state with parent when opened
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  function handleSave() {
    setSettings(localSettings);
    onClose();
  }

  function handleTimeCueChange(idx, field, value) {
    const cues = [...localSettings.timeCues];
    cues[idx][field] = value;
    setLocalSettings({ ...localSettings, timeCues: cues });
  }

  function handleAddTimeCue() {
    setLocalSettings({
      ...localSettings,
      timeCues: [...localSettings.timeCues, { type: "seconds", value: 30 }],
    });
  }

  function handleRemoveTimeCue(idx) {
    const cues = [...localSettings.timeCues];
    cues.splice(idx, 1);
    setLocalSettings({ ...localSettings, timeCues: cues });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <div className="space-y-4">
          {/* --- Audio Cue Mode Selection --- */}
          <div>
            <label className="block mb-1 font-medium">Audio Cue Mode</label>
            <select
              value={localSettings.mode}
              onChange={e =>
                setLocalSettings({ ...localSettings, mode: e.target.value })
              }
              className="border rounded px-2 py-1 w-full"
            >
              <option value="default">Default (Game Voices, Fixed Cues)</option>
              <option value="custom">Custom (TTS, User Cues)</option>
            </select>
          </div>
          {/* --- Voice Selection (only in default mode) --- */}
          {localSettings.mode === "default" && (
            <div>
              <label className="block mb-1 font-medium">Voice</label>
              <select
                value={localSettings.voice}
                onChange={e =>
                  setLocalSettings({ ...localSettings, voice: e.target.value })
                }
                className="border rounded px-2 py-1 w-full"
              >
                {DEFAULT_VOICES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={e =>
                  setLocalSettings({ ...localSettings, enabled: e.target.checked })
                }
              />
              Enable Audio Cues
            </label>
          </div>
          <div>
            <label className="block mb-1 font-medium">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={localSettings.volume}
              onChange={e =>
                setLocalSettings({ ...localSettings, volume: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <div className="text-xs text-gray-500">{Math.round(localSettings.volume * 100)}%</div>
          </div>
          {/* --- Custom Mode: Time Cues and Cue Type Toggles --- */}
          {localSettings.mode === "custom" && (
            <>
              <div>
                <label className="block mb-1 font-medium">Time Remaining Cues</label>
                <div className="space-y-2">
                  {localSettings.timeCues.map((cue, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={cue.type}
                        onChange={e => handleTimeCueChange(idx, "type", e.target.value)}
                        className="border rounded px-1 py-0.5"
                      >
                        <option value="percent">Percent</option>
                        <option value="seconds">Seconds</option>
                      </select>
                      <input
                        type="number"
                        min={cue.type === "percent" ? 1 : 1}
                        max={cue.type === "percent" ? 99 : 600}
                        value={cue.value}
                        onChange={e => handleTimeCueChange(idx, "value", parseInt(e.target.value, 10))}
                        className="border rounded px-1 py-0.5 w-16"
                      />
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() => handleRemoveTimeCue(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={handleAddTimeCue}
                  >
                    Add Cue
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Cue Type</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.useAudioFiles.noontideStart}
                      onChange={e =>
                        setLocalSettings({
                          ...localSettings,
                          useAudioFiles: {
                            ...localSettings.useAudioFiles,
                            noontideStart: e.target.checked,
                          },
                        })
                      }
                    />
                    Enable Noontide Start Cue
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.useAudioFiles.nightStart}
                      onChange={e =>
                        setLocalSettings({
                          ...localSettings,
                          useAudioFiles: {
                            ...localSettings.useAudioFiles,
                            nightStart: e.target.checked,
                          },
                        })
                      }
                    />
                    Enable Night Start Cue
                  </label>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  (Cues use browser TTS in custom mode)
                </div>
              </div>
            </>
          )}
          {/* --- Default Mode: Info --- */}
          {localSettings.mode === "default" && (
            <div className="text-xs text-gray-500">
              Cues will play at: Noontide Start, Night Start, 3min, 2min, 1min remaining.<br />
              Uses selected voice audio files.
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-black font-semibold hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
