import { useEffect, useState } from "react";

interface AudioPlayer {
  src: string;
  refAudio: React.RefCallback<HTMLAudioElement>;
}
export function AudioPlayer(props: AudioPlayer) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    function handleDoubleClick() {
      setHidden((h) => !h);
    }
    document.addEventListener("dblclick", handleDoubleClick);
    return () => {
      document.removeEventListener("dblclick", handleDoubleClick);
    };
  }, []);
  return (
    <div hidden={hidden}>
      <audio
        src={props.src}
        controls
        ref={props.refAudio}
        style={{ width: "100%" }}
      />
      Double-click the web page to show/hide audio player. Use browser zoom
      functionality to adjust size.
    </div>
  );
}
