import { Monitor } from "lucide-react";
import { useSimStore } from "./store/useSimStore";
import { DeviceCard } from "./components/DeviceCard";
import { ProtocolLog } from "./components/ProtocolLog";
import { NetworkConditions } from "./components/NetworkConditions";

export default function App() {
  const { devices, log, connected, clearLog } = useSimStore();

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <Monitor size={20} />
          OpenAVC Simulator
        </div>
        <div className="header-right">
          <NetworkConditions />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <div className={`connection-dot ${connected ? "connected" : "disconnected"}`} />
            {connected ? "Connected" : "Disconnected"}
          </div>
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
