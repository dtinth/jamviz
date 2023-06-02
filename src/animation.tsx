import { colord } from "./colord";
import md5 from "md5";
import { instruments } from "./data";

export interface Client {
  name: string;
  city: string;
  country: number;
  skillLevel: number;
  instrument: number;
}

export interface FrameData {
  clients: ClientFrameData[];
}

export interface ClientFrameData {
  id: string;
  name: string;
  x: number;
  y: number;
  a: number;
  color: string;
  displayedSoundLevel: number;
  instrument: string;
}

function createAnimation() {
  let lastTime: number | undefined;
  const clients = new Map<string, ClientViewModel>();
  const connectedIds = new Set<string>();
  let ids: string[] = [];

  function ingest(data?: { clients?: Client[]; levels?: number[] }) {
    if (!data) return;
    if (data.clients) {
      const used = new Set<string>();
      ids = [];
      for (const client of data.clients) {
        let id = client.name;
        while (used.has(id)) id += "$";
        used.add(id);
        connectedIds.add(id);
        let vm = clients.get(id);
        if (!vm) {
          vm = createClientViewModel(id);
          clients.set(id, vm);
        }
        vm.name = client.name;
        vm.connected = true;
        vm.instrument = client.instrument ? instruments[client.instrument] : "";
        ids.push(id);
      }
      for (const id of Array.from(connectedIds)) {
        if (!used.has(id)) {
          connectedIds.delete(id);
          const client = clients.get(id);
          if (client) {
            client.connected = false;
          }
        }
      }
    }
    if (data.levels) {
      for (const [i, level] of data.levels.entries()) {
        const id = ids[i];
        const vm = clients.get(id);
        if (vm) {
          vm.soundLevel = level;
        }
      }
    }
  }
  function frame(time: number): FrameData {
    const delta = lastTime ? time - lastTime : 16;

    for (const vm of clients.values()) {
      evaluateClient(vm, time);
    }
    const clientsToShow = Array.from(clients.values()).filter(
      (x) => x.shouldDisplay || x.a > 0.01
    );
    const clientsToLayout = clientsToShow
      .filter((x) => x.shouldDisplay)
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    for (const [i, vm] of clientsToLayout.entries()) {
      layoutClient(vm, i, clientsToLayout.length);
    }
    for (const vm of clients.values()) {
      animateClient(vm, time, delta);
    }

    return {
      clients: clientsToShow,
    };
  }
  return { ingest, frame };
}

interface ClientViewModel {
  id: string;
  name: string;
  connected: boolean;
  soundLevel: number;
  instrument: string;
  color: string;

  lastSound: number;

  shouldDisplay: boolean;
  targetX: number;
  targetY: number;

  x: number;
  y: number;
  a: number;
  displayedSoundLevel: number;
}

function createClientViewModel(id: string): ClientViewModel {
  const hash = md5(id);
  const hue = parseInt(hash.slice(0, 7), 16) % 360;
  const vm: ClientViewModel = {
    id,
    name: "",
    connected: false,
    soundLevel: 0,
    lastSound: -Infinity,
    instrument: "",
    color: rgbToString(colord({ h: hue, c: 72, l: 80 }).toRgb()),

    shouldDisplay: false,
    targetX: 0,
    targetY: 0,

    x: 0,
    y: 0,
    a: 0,
    displayedSoundLevel: 0,
  };
  return vm;
}

function rgbToString(rgb: { r: number; g: number; b: number }) {
  return [Math.round(rgb.r), Math.round(rgb.g), Math.round(rgb.b)].join(" ");
}

function evaluateClient(vm: ClientViewModel, time: number) {
  if (vm.soundLevel >= 2) {
    vm.lastSound = time;
  }
  vm.shouldDisplay = vm.connected && time - vm.lastSound < 4000;
}

function layoutClient(vm: ClientViewModel, i: number, count: number) {
  const maxColumns = 4;
  const numRows = Math.ceil(count / maxColumns);
  const row = Math.floor(i / maxColumns);
  const column = i % maxColumns;
  const rowSize = row === numRows - 1 ? count % maxColumns : maxColumns;
  const centerX = (rowSize - 1) / 2;
  const centerY = (numRows - 1) / 2;
  const x = column - centerX;
  const y = row - centerY;
  vm.targetX = x;
  vm.targetY = y;
}
function animateClient(vm: ClientViewModel, time: number, delta: number) {
  vm.x = exponentialRamp(vm.x, vm.targetX, delta);
  vm.y = exponentialRamp(vm.y, vm.targetY, delta);
  const targetOpacity = vm.shouldDisplay
    ? time - vm.lastSound < 1000
      ? 1
      : 0.5
    : 0;
  vm.a = exponentialRamp(vm.a, targetOpacity, delta);
  const targetSoundLevel = vm.soundLevel / 8;
  vm.displayedSoundLevel -= (delta / 1000) * 0.2;
  if (vm.displayedSoundLevel < targetSoundLevel) {
    vm.displayedSoundLevel = exponentialRamp(
      vm.displayedSoundLevel,
      targetSoundLevel,
      delta,
      0.2
    );
  }
}
function exponentialRamp(
  value: number,
  target: number,
  deltaTime: number,
  speed = 0.1
) {
  const frames = deltaTime / 16;
  const progressLeft = (1 - speed) ** frames;
  const progress = 1 - progressLeft;
  return value * progressLeft + target * progress;
}

export const animation = createAnimation();

// fetch("http://localhost:1111/events.ndjson")
//   .then((r) => {
//     if (!r.ok) {
//       throw new Error(r.statusText);
//     }
//     return r.text();
//   })
//   .then(async (text) => {
//     const events = text
//       .split("\n")
//       .filter((x) => x.trim())
//       .map((x) => JSON.parse(x));
//     let lastTime: number | undefined;
//     const start = performance.now();
//     let target = performance.now();
//     for (const e of events) {
//       if (e.initial) {
//         lastTime = e.initial.startTime;
//         console.log(e.initial);
//         animation.ingest(e.initial.state);
//       } else if (e.event && lastTime) {
//         const delta = e.event.time - lastTime;
//         target += delta;
//         lastTime = e.event.time;
//         await new Promise((r) => setTimeout(r, target - performance.now()));
//         animation.ingest(e.event.data);
//       }
//     }
//   });

const eventSource = new EventSource("https://lobby.musicjammingth.net/events");

eventSource.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  animation.ingest(data);
});
