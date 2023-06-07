import ReactDOM from "react-dom/client";
import React from "react";

export async function showLoadForm() {
  return new Promise<{ text: string; audioSrc?: string | null }>((resolve) => {
    const form = document.createElement("div");
    document.body.appendChild(form);
    const view = () => {
      const server = (document.getElementById("server") as HTMLInputElement)
        .value;
      window.location.href = `?apiserver=${server}`;
    };
    const play = async () => {
      const eventsFile = (
        document.getElementById("events-file") as HTMLInputElement
      ).files![0];
      const text = await eventsFile.text();
      const audioFile = (
        document.getElementById("audio-file") as HTMLInputElement
      ).files![0];
      const audioSrc = audioFile && URL.createObjectURL(audioFile);
      resolve({ text, audioSrc });
      root.unmount();
    };
    const root = ReactDOM.createRoot(form);
    root.render(
      <React.StrictMode>
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#333",
              border: "2px solid #999",
              padding: "1em",
            }}
          >
            <h1>jamviz</h1>
            <fieldset>
              <legend>View live</legend>
              jamulus-lounge server:
              <br />
              <input
                type="text"
                id="server"
                defaultValue="https://lobby.musicjammingth.net"
                size={40}
              />
              <input type="button" value="View" onClick={view} />
            </fieldset>
            <fieldset>
              <legend>Play recording</legend>
              audio: <input type="file" id="audio-file" accept=".mp3" />
              <br />
              events: <input type="file" id="events-file" accept=".ndjson" />
              <br />
              <input type="button" value="View" onClick={play} />
            </fieldset>
          </div>
        </div>
      </React.StrictMode>
    );
  });
}
