import { useEffect, useState } from "react";
import "./App.css";
import {
  AnimationPlayer,
  ClientFrameData,
  FrameData,
  animationPlayerPromise,
} from "./animation";
import { searchParams } from "./searchParams";

const clock = ((v: string | null) => {
  return v ? +v : null;
})(searchParams.get("clock"));

function App() {
  const [animationPlayer, setAnimationPlayer] = useState<
    AnimationPlayer | undefined
  >();
  useEffect(() => {
    animationPlayerPromise.then((ap) => {
      setAnimationPlayer(ap);
    });
  }, []);
  return (
    <>
      {!!animationPlayer && <ClientsView animationPlayer={animationPlayer} />}
      <ClockView />
    </>
  );
}

interface ClientsView {
  animationPlayer: AnimationPlayer;
}
function ClientsView(props: ClientsView) {
  const [frameData, setFrameData] = useState<FrameData>({
    clients: [],
  });

  useEffect(() => {
    let dead = false;
    async function frame() {
      if (dead) return;
      setFrameData(props.animationPlayer.frame(performance.now()));
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return () => {
      dead = true;
    };
  }, []);

  return (
    <>
      {frameData.clients.map((c) => {
        return <ClientView key={c.id} client={c} />;
      })}
    </>
  );
}

interface ClientView {
  client: ClientFrameData;
}
function ClientView({ client }: ClientView) {
  const x = client.x * 300;
  const y = client.y * 100;
  return (
    <div
      className="client"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        opacity: client.a,
        ...({
          "--sound-level": client.displayedSoundLevel,
          "--client-color": client.color,
        } as any),
      }}
    >
      <div className="clientPos">
        <div className="clientSoundLevel"></div>
        <div className="clientName">{client.name}</div>
        {!!client.instrument && (
          <div className="clientInstrument">{client.instrument}</div>
        )}
      </div>
    </div>
  );
}

function ClockView() {
  const [now, setNow] = useState("");
  useEffect(() => {
    if (clock == null) return;
    const updateClock = () => {
      const text = new Date(Date.now() + clock * 3600e3)
        .toISOString()
        .split("T")[1]
        .split(".")[0];
      setNow(text);
    };
    updateClock();
    const interval = setInterval(() => {
      updateClock();
    }, 200);
    return () => {
      clearInterval(interval);
    };
  }, []);
  if (!now) return <></>;
  return <div className="clock">{now}</div>;
}

export default App;
