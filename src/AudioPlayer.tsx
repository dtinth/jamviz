import { useStore } from "@nanostores/react";
import { EyeClosedIcon } from "@radix-ui/react-icons";
import { Button, Flex, Slider, Tooltip } from "@radix-ui/themes";
import { atom } from "nanostores";
import { useEffect, useState } from "react";

const $zoom = atom(1);
$zoom.subscribe((zoom) => {
  document.documentElement.style.setProperty("--zoom", zoom.toString());
});

interface AudioPlayer {
  src: string;
  refAudio: React.RefCallback<HTMLAudioElement>;
}
export function AudioPlayer(props: AudioPlayer) {
  const [hidden, setHidden] = useState(false);
  const zoom = useStore($zoom);
  useEffect(() => {
    function handleClick() {
      setHidden(false);
    }
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [hidden]);
  return (
    <div hidden={hidden}>
      <Flex gap="2" direction="column">
        <Flex gap="2" align="center">
          <Button onClick={() => requestAnimationFrame(() => setHidden(true))}>
            <EyeClosedIcon />
            Hide audio player
          </Button>
          {/* <Button asChild variant="surface">
            <a href={props.src} download="audio.mp3">
              <ArrowDownIcon />
              Download
            </a>
          </Button> */}
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
      </Flex>
    </div>
  );
}
