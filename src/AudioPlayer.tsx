import { useStore } from "@nanostores/react";
import { ArrowDownIcon, EyeClosedIcon } from "@radix-ui/react-icons";
import { Button, Flex, Slider, Tooltip } from "@radix-ui/themes";
import { atom } from "nanostores";
import { useEffect, useState } from "react";

const $zoom = atom(1);
$zoom.subscribe((zoom) => {
  document.documentElement.style.setProperty("--zoom", zoom.toString());
});

const $downloading = atom(null as DownloadingPopup | null);

interface AudioPlayer {
  src: string;
  refAudio: React.RefCallback<HTMLAudioElement>;
}
export function AudioPlayer(props: AudioPlayer) {
  const [hidden, setHidden] = useState(false);
  const zoom = useStore($zoom);
  const downloading = useStore($downloading);
  useEffect(() => {
    function handleClick() {
      setHidden(false);
    }
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [hidden]);
  const dl = () => {
    let canceled = false;
    const onCancel = () => {
      canceled = true;
      $downloading.set(null);
    };
    $downloading.set({ percent: 0, onCancel });
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.open("GET", props.src);
    xhr.onprogress = (event) => {
      if (event.lengthComputable && !canceled) {
        $downloading.set({
          percent: Math.round((event.loaded / event.total) * 100),
          onCancel,
        });
      }
    };
    xhr.onload = () => {
      if (canceled) return;
      const url = URL.createObjectURL(xhr.response);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        new URL(props.src).pathname
          .replace(/\/audio\.mp3$/, "")
          .replace(/\//g, "-")
          .replace(/^-|-$/, "") + ".mp3";
      a.click();
      URL.revokeObjectURL(url);
      $downloading.set(null);
    };
    xhr.onerror = () => {
      window.alert("Download failed");
      $downloading.set(null);
    };
    xhr.send();
  };
  return (
    <div hidden={hidden}>
      <Flex gap="2" direction="column">
        <Flex gap="2" align="center">
          <Button onClick={() => requestAnimationFrame(() => setHidden(true))}>
            <EyeClosedIcon />
            Hide audio player
          </Button>
          <Button variant="surface" disabled={downloading != null} onClick={dl}>
            <ArrowDownIcon />
            Download
          </Button>
          <div style={{ width: 128 }}>
            <Tooltip content={`Zoom: ${zoom}x`}>
              <Slider
                value={[zoom]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={(values) => $zoom.set(values[0])}
              />
            </Tooltip>
          </div>
        </Flex>
        <audio
          src={props.src}
          controls
          ref={props.refAudio}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        {downloading != null && (
          <DownloadingPopup
            percent={downloading.percent}
            onCancel={downloading.onCancel}
          />
        )}
      </Flex>
    </div>
  );
}

export interface DownloadingPopup {
  onCancel: () => void;
  percent: number;
}
export function DownloadingPopup(props: DownloadingPopup) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(53,52,51,0.9)",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
      }}
    >
      <Flex direction="column" gap="2" align="center">
        <div>Downloading… ({props.percent}%)</div>
        <Button onClick={props.onCancel}>Cancel</Button>
      </Flex>
    </div>
  );
}
