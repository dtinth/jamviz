import { Fragment, useEffect, useState } from "react";
import "./App.css";
import { ClientFrameData, FrameData, animation } from "./animation";

function App() {
  const [frameData, setFrameData] = useState<FrameData>({
    clients: [],
  });

  useEffect(() => {
    let dead = false;
    async function frame() {
      if (dead) return;
      setFrameData(animation.frame(performance.now()));
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

function ClientView({ client }: { client: ClientFrameData }) {
  const x = client.x * 320;
  const y = client.y * 120;
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

export default App;
