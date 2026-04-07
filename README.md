# OpenAVC Simulator

Simulate AV equipment on your network without real hardware. The OpenAVC Simulator runs fake protocol servers that behave like real projectors, displays, switchers, DSPs, and cameras. Connect any control system to the simulated devices as if they were real gear.

## What It Does

- Simulates device protocols over TCP and HTTP on your local network
- YAML drivers (`.avcdriver`) get simulation automatically with zero additional work
- Python drivers use a simple `handle_command()` or `handle_request()` interface
- Visual UI shows device state, interactive controls, and raw protocol traffic
- Network condition simulation (latency, jitter, packet drops) for testing
- Error injection (timeout, corrupt data, disconnect) to test failure handling

## Quick Start

```bash
# Install
pip install -e .

# Start with driver discovery
python -m simulator --driver-paths /path/to/openavc-drivers

# Start with a config file
python -m simulator --config sim_config.json
```

The simulator discovers drivers from the provided paths, starts protocol servers for each, and serves the UI at `http://localhost:19500`.

### Config File Format

```json
{
  "driver_paths": ["../openavc-drivers"],
  "devices": [
    { "device_id": "projector_1", "driver_id": "pjlink_class1" },
    { "device_id": "switcher_1", "driver_id": "extron_sis" },
    { "device_id": "display_1", "driver_id": "samsung_mdc" }
  ],
  "ui_port": 19500
}
```

### Using with OpenAVC

Click the **Simulate** button in the Programmer IDE sidebar. OpenAVC spawns the simulator, redirects device connections to localhost, and opens the Simulator UI. Click again to stop and restore real connections.

## Writing Simulators

### YAML Drivers (Zero Work)

Any `.avcdriver` file works automatically. The simulator reverses the driver's command and response definitions to generate a working protocol responder. Add an optional `simulator:` section for enhanced realism:

```yaml
# Appended to your .avcdriver file
simulator:
  initial_state:
    input: 1
    volume: 50

  delays:
    command_response: 0.02

  state_machines:
    power:
      states: [off, warming, on, cooling]
      initial: off
      transitions:
        - { from: off, trigger: power_on, to: warming }
        - { from: warming, after_seconds: 3.0, to: on }
        - { from: on, trigger: power_off, to: cooling }
        - { from: cooling, after_seconds: 2.0, to: off }

  error_modes:
    communication_timeout:
      description: "Device stops responding"
      behavior: no_response
```

### Python Drivers (Scaffold + Fill In)

Generate a skeleton from your driver file:

```bash
python -m simulator.scaffold path/to/your_driver.py
# Creates: path/to/your_driver_sim.py
```

The skeleton has all state variables and commands pre-populated. Fill in the protocol logic:

**TCP drivers** implement `handle_command(data: bytes) -> bytes | None`:

```python
class MyDeviceSimulator(TCPSimulator):
    SIMULATOR_INFO = {
        "driver_id": "my_device",
        "name": "My Device Simulator",
        "category": "display",
        "transport": "tcp",
        "default_port": 1234,
        "initial_state": {"power": "off", "volume": 50},
    }

    def handle_command(self, data: bytes) -> bytes | None:
        text = data.decode().strip()
        if text == "POWER ON":
            self.set_state("power", "on")
            return b"OK\r\n"
        if text == "VOL?":
            return f"VOL {self.state['volume']}\r\n".encode()
        return None
```

**HTTP drivers** implement `handle_request(method, path, headers, body) -> (status, body)`:

```python
class MyAPISimulator(HTTPSimulator):
    SIMULATOR_INFO = {
        "driver_id": "my_api_device",
        "transport": "http",
        "initial_state": {"power": "off"},
        ...
    }

    def handle_request(self, method, path, headers, body):
        if path == "/api/power" and method == "POST":
            data = json.loads(body)
            self.set_state("power", data["power"])
            return 200, {"status": "ok"}
        return 404, {"error": "not found"}
```

### What the Framework Handles

You write the protocol logic. The framework handles everything else:

- TCP/HTTP server lifecycle and port allocation
- State management (`self.state`, `self.set_state()`)
- Error injection (`self.active_errors`, `self.has_error_behavior()`)
- Protocol logging (all traffic captured for the UI)
- Network condition simulation (latency, drops)
- WebSocket broadcasting to the UI
- REST API for external control

## Simulator UI

The UI runs at `http://localhost:19500` and shows:

- **Device cards** with category-appropriate visuals (projector, display, switcher, audio, camera)
- **Interactive controls** to change device state from the "hardware side"
- **Error injection** toggles per device
- **Protocol log** with timestamps, direction indicators, and device filtering
- **Network conditions** preset selector (Perfect, Typical LAN, Busy Network, Flaky WiFi, Barely Working)

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Overall simulator status |
| `/api/available` | GET | Discovered drivers |
| `/api/devices` | GET | Running simulator instances |
| `/api/devices/{id}` | GET | Single device state |
| `/api/devices/{id}/start` | POST | Start simulating a device |
| `/api/devices/{id}/stop` | POST | Stop simulating a device |
| `/api/devices/{id}/state` | POST | Change device state |
| `/api/devices/{id}/errors/{mode}` | POST | Inject or clear an error |
| `/api/devices/{id}/log` | GET | Protocol log entries |
| `/api/network` | GET/POST | Network condition settings |
| `/api/network/preset` | POST | Apply a named preset |
| `/ws` | WebSocket | Real-time state and protocol updates |

## Writing Simulators for Your Drivers

For the complete guide on adding simulation support to your drivers, see [Writing Simulators](https://github.com/open-avc/openavc-drivers/blob/main/docs/writing-simulators.md) in the driver repository. It covers all four levels of effort from zero-work YAML auto-generation through advanced Python simulators with authentication, state machines, and push notifications.

## Requirements

- Python 3.11+
- Node.js 18+ (for building the UI)

## License

MIT
