# jamviz

Jamulus activity visualizer. It can visualize Jamulus events coming through [gojam](https://github.com/dtinth/gojam) or [jamulus-lounge](https://github.com/dtinth/jamulus-lounge). It operates in 2 modes:

- **Live mode:** Visualize events as it happens. [Example stream archive](https://youtu.be/MX90Xrnjs2k)
- **Recording mode:** Record audio and events from Jamulus lounge, and visualize the recorded events later. [Example video](https://youtu.be/0-ZXr-3cpcI)

## Configurable parameters

You can adjust the behavior of the visualizer by adding parameters (`?name1=value1&name2=value2`) to the URL.

- `?columns=3` — Maximum number of columns to display (default 4).
- `?clock=7` — Show a clock at the bottom-right corner. The value is the timezone offset in hours.
