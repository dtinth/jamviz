import { colord } from "./colord";
import md5 from "md5";
import { instruments } from "./data";
import { searchParams } from "./searchParams";
import { Approacher, approach, createApproacher } from "./Approacher";
import { showLoadForm } from "./showLoadForm";
import pDefer from "p-defer";
import { createRoot } from "react-dom/client";
import { AudioPlayer } from "./AudioPlayer";

const numColumns = +searchParams.get("columns")! || 4;
const server = searchParams.get("apiserver");
const eventNdjsonSrc = searchParams.get("src");
const audioSrc = searchParams.get("audio");
const hashBase = searchParams.get("color") || "";

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

interface GojamEvent {
  clients?: Client[];
  levels?: number[];
}

export interface AnimationPlayer {
  frame: (time: number) => FrameData;
}

export interface Animation {
  ingest: (data: GojamEvent) => void;
  player: AnimationPlayer;
}

function createAnimation(): Animation {
  let lastTime: number | undefined;
  const clients = new Map<string, ClientViewModel>();
  const connectedIds = new Set<string>();
  let ids: string[] = [];

  function ingest(data?: GojamEvent) {
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
    layoutClients(clientsToLayout);
    for (const vm of clients.values()) {
      animateClient(vm, time, delta);
    }

    return {
      clients: clientsToShow.map((c) => ({ ...c })),
    };
  }
  return {
    ingest,
    player: { frame } satisfies AnimationPlayer,
  };
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

  xApproacher: Approacher;
  yApproacher: Approacher;
  x: number;
  y: number;
  a: number;
  displayedSoundLevel: number;
}

function createClientViewModel(id: string): ClientViewModel {
  const hash = md5(id + hashBase);
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

    xApproacher: createApproacher(),
    yApproacher: createApproacher(),
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
  vm.shouldDisplay = vm.connected && time - vm.lastSound < 32000;
}

function layoutClients(vms: ClientViewModel[]) {
  const maxColumns = getBestColumns(vms.length);
  for (const [i, vm] of vms.entries()) {
    layoutClient(vm, i, vms.length, maxColumns);
  }
}

function getBestColumns(count: number) {
  const numRows = Math.ceil(count / numColumns);
  const candidates: { numColumns: number; mse: number }[] = [];
  for (let i = numColumns; i >= 1; i--) {
    const numRowsCandidate = Math.ceil(count / i);
    if (numRowsCandidate !== numRows) {
      break;
    }
    const averageWidth = count / i;
    const meanSquaredError = Array.from({ length: numRows }, (_, j) => {
      const width = j === numRows - 1 ? count % i || i : i;
      return (width - averageWidth) ** 2;
    }).reduce((a, b) => a + b, 0);
    candidates.push({ numColumns: i, mse: meanSquaredError });
  }
  if (candidates.length > 1) Object.assign(window, { candidates });
  return candidates.sort((a, b) => a.mse - b.mse)[0].numColumns;
}

function layoutClient(
  vm: ClientViewModel,
  i: number,
  count: number,
  maxColumns: number
) {
  const numRows = Math.ceil(count / maxColumns);
  const row = Math.floor(i / maxColumns);
  const column = i % maxColumns;
  const rowSize =
    row === numRows - 1 ? count % maxColumns || maxColumns : maxColumns;
  const centerX = (rowSize - 1) / 2;
  const centerY = (numRows - 1) / 2;
  const x = column - centerX;
  const y = row - centerY;
  vm.targetX = x;
  vm.targetY = y;
}

function animateClient(vm: ClientViewModel, time: number, delta: number) {
  vm.x = approach(vm.xApproacher, vm.targetX, delta);
  vm.y = approach(vm.yApproacher, vm.targetY, delta);
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

interface TimedGojamEvent {
  time: number;
  data: GojamEvent;
}

function createAudioPlayer(src: string): AudioPlayer {
  const duration = pDefer<number>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let audio: HTMLAudioElement | undefined;
  root.render(
    <AudioPlayer
      src={src}
      refAudio={(el) => {
        audio = el ?? undefined;
        if (!el) return;
        el.addEventListener("loadedmetadata", () => {
          duration.resolve(el.duration);
        });
      }}
    />
  );
  return {
    durationPromise: duration.promise,
    getCurrentTime: () => audio?.currentTime || 0,
  };
}

interface AudioPlayer {
  durationPromise: Promise<number>;
  getCurrentTime(): number;
}

async function runStoredEvents(
  text: string,
  audioSrc?: string | null
): Promise<AnimationPlayer> {
  const events = text
    .split("\n")
    .filter((x) => x.trim())
    .map((x) => JSON.parse(x));
  if (audioSrc) {
    const audioPlayer: AudioPlayer = ((window as any).audioPlayer ??=
      createAudioPlayer(audioSrc));
    const duration = await audioPlayer.durationPromise;
    const nFrames = Math.ceil(duration * 60);
    const dataEvents: TimedGojamEvent[] = [];
    const animationFrames: FrameData[] = [];
    let startTime: number | undefined;
    const animation = createAnimation();
    for (const e of events) {
      if (e.initial) {
        startTime = e.initial.startTime;
        animation.ingest(e.initial.state);
      } else if (e.event) {
        dataEvents.push(e.event);
      }
    }
    if (!startTime) {
      throw new Error("No start time");
    }
    let nextEventIndex = 0;
    for (let i = 0; i < nFrames; i++) {
      const animationTime = (i / 60) * 1000;
      const eventTime = startTime + animationTime;
      while (
        nextEventIndex < dataEvents.length &&
        dataEvents[nextEventIndex].time < eventTime
      ) {
        animation.ingest(dataEvents[nextEventIndex].data);
        nextEventIndex++;
      }
      animationFrames.push(animation.player.frame(animationTime));
    }
    return {
      frame: () => {
        const index = Math.floor(audioPlayer.getCurrentTime() * 60);
        return animationFrames[
          Math.max(0, Math.min(index, animationFrames.length - 1))
        ];
      },
    };
  } else {
    const animation = createAnimation();
    const worker = async () => {
      let lastTime: number | undefined;
      let target = performance.now();
      for (const e of events) {
        if (e.initial) {
          lastTime = e.initial.startTime;
          console.log(e.initial);
          animation.ingest(e.initial.state);
        } else if (e.event && lastTime) {
          const delta = e.event.time - lastTime;
          target += delta;
          lastTime = e.event.time;
          await new Promise((r) => setTimeout(r, target - performance.now()));
          animation.ingest(e.event.data);
        }
      }
    };
    worker();
    return animation.player;
  }
}

export async function getAnimationPlayer(): Promise<AnimationPlayer> {
  if (server) {
    const eventSource = new EventSource(server + "/events");
    const animation = createAnimation();
    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      animation.ingest(data);
    });
    return animation.player;
  } else if (eventNdjsonSrc) {
    const r = await fetch(eventNdjsonSrc);
    if (!r.ok) {
      throw new Error(r.statusText);
    }
    const text = await r.text();
    return runStoredEvents(text, audioSrc);
  } else {
    const x = await showLoadForm();
    return runStoredEvents(x.text, x.audioSrc);
  }
}

export const animationPlayerPromise = getAnimationPlayer();
