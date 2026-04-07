import { Monitor, Power } from "lucide-react";
import { useSimStore } from "./store/useSimStore";
import { DeviceCard } from "./components/DeviceCard";
import { ProtocolLog } from "./components/ProtocolLog";
import { NetworkConditions } from "./components/NetworkConditions";

export default function App() {
  const { devices, log, connected, clearLog } = useSimStore();

  const handleShutdown = async () => {
    if (!confirm("Stop the simulator and close this window?")) return;
    try {
      await fetch("/api/shutdown", { method: "POST" });
      setTimeout(() => window.close(), 500);
    } catch { /* process is shutting down */ }
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <Monitor size={20} />
          OpenAVC Simulator
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
            {devices.length} device{devices.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="header-right">
          <NetworkConditions />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <div className={`connection-dot ${connected ? "connected" : "disconnected"}`} />
            {connected ? "Connected" : "Disconnected"}
          </div>
          <button
            onClick={handleShutdown}
            title="Stop simulator"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: "var(--border-radius)",
              fontSize: 12,
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
            }}
          >
            <Power size={14} />
            Stop
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Device grid */}
        <div className="device-grid">
          {devices.length === 0 && (
            <div className="empty-state">
              <h3>No simulated devices</h3>
              <p>Start the simulator with driver paths and device configuration to see devices here.</p>
            </div>
          )}
          {devices.map((device) => (
            <DeviceCard key={device.device_id} device={device} />
          ))}
        </div>

        {/* Protocol log */}
        <ProtocolLog entries={log} onClear={clearLog} />
      </div>
    </div>
  );
}
