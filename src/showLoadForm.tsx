import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Tabs,
  TextField,
  Theme,
} from "@radix-ui/themes";
import React, { ReactNode } from "react";
import ReactDOM from "react-dom/client";

export async function showLoadForm() {
  return new Promise<{ text: string; audioSrc?: string | null }>((resolve) => {
    const form = document.createElement("div");
    document.body.appendChild(form);
    const view = () => {
      const server = (document.getElementById("server") as HTMLInputElement)
        .value;
      window.location.href = `?apiserver=${server}`;
    };
    const replayUrl = () => {
      const url = (document.getElementById("replayUrl") as HTMLInputElement)
        .value;
      window.location.href = `?replay=${encodeURIComponent(url)}`;
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
    const tabs = new TabBuilder()
      .tab(
        "view",
        "View live",
        <>
          jamulus-lounge server:
          <br />
          <TextField.Root>
            <TextField.Input
              id="server"
              defaultValue="https://lobby.musicjammingth.net"
              type="text"
            />
          </TextField.Root>
          <Button onClick={view}>View</Button>
        </>
      )
      .tab(
        "replay-files",
        "Replay files",
        <>
          audio: <input type="file" id="audio-file" accept=".mp3" />
          events: <input type="file" id="events-file" accept=".ndjson" />
          <Button onClick={play}>Play</Button>
        </>
      )
      .tab(
        "replay-url",
        "Replay URL",
        <>
          replay URL:
          <br />
          <TextField.Root>
            <TextField.Input
              id="replayUrl"
              placeholder="https://media.mjth.live/…"
              type="text"
            />
          </TextField.Root>
          <Button onClick={replayUrl}>View</Button>
        </>
      )
      .build();
    root.render(
      <React.StrictMode>
        <Theme appearance="dark" panelBackground="solid">
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Card>
              <Flex direction="column" gap={"2"}>
                <Heading>jamviz</Heading>
                {tabs}
              </Flex>
            </Card>
          </div>
        </Theme>
      </React.StrictMode>
    );
  });
}

class TabBuilder {
  private values: string[] = [];
  private triggers: ReactNode[] = [];
  private contents: ReactNode[] = [];
  tab(value: string, trigger: ReactNode, content: ReactNode) {
    this.values.push(value);
    this.triggers.push(
      <Tabs.Trigger key={value} value={value}>
        {trigger}
      </Tabs.Trigger>
    );
    this.contents.push(
      <Tabs.Content key={value} value={value}>
        <Flex gap="2" direction="column" style={{ minHeight: "180px" }}>
          {content}
        </Flex>
      </Tabs.Content>
    );
    return this;
  }
  build() {
    return (
      <Tabs.Root defaultValue={this.values[0]}>
        <Tabs.List>{this.triggers}</Tabs.List>
        <Box px="4" pt="4" pb="3">
          {this.contents}
        </Box>
      </Tabs.Root>
    );
  }
}
