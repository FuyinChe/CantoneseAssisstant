import { randomBytes, randomUUID, createHash } from "node:crypto";
import WebSocket from "ws";
import { buildSsml } from "./catalog";
import type { SpeechLang } from "./types";

const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_VERSION = "143.0.3650.75";
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}`;
const WIN_EPOCH = 11644473600;

function secMsGec(skewSeconds = 0) {
  let ticks = Date.now() / 1000 + skewSeconds + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks = Math.round(ticks * 1e7);
  return createHash("sha256").update(`${ticks}${TOKEN}`).digest("hex").toUpperCase();
}

function edgeDate(date = new Date()) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${days[date.getUTCDay()]} ${months[date.getUTCMonth()]} ${pad(date.getUTCDate())} ` +
    `${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} ` +
    "GMT+0000 (Coordinated Universal Time)"
  );
}

function speechConfig() {
  return (
    `X-Timestamp:${edgeDate()}\r\n` +
    "Content-Type:application/json; charset=utf-8\r\n" +
    "Path:speech.config\r\n\r\n" +
    '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n'
  );
}

function ssmlMessage(text: string, lang: SpeechLang) {
  const requestId = randomUUID().replaceAll("-", "");
  return (
    `X-RequestId:${requestId}\r\n` +
    "Content-Type:application/ssml+xml\r\n" +
    `X-Timestamp:${edgeDate()}Z\r\n` +
    "Path:ssml\r\n\r\n" +
    buildSsml(text, lang, "en-US")
  );
}

function audioChunk(message: Buffer) {
  if (message.length < 2) return null;
  const headerLength = message.readUInt16BE(0);
  if (headerLength + 2 > message.length) return null;
  const header = message.subarray(2, 2 + headerLength).toString("utf8");
  if (!header.includes("Path:audio")) return null;
  const body = message.subarray(2 + headerLength);
  if (!header.includes("Content-Type:audio/mpeg") || body.length === 0) return null;
  return body;
}

function connect(text: string, lang: SpeechLang, skewSeconds: number) {
  const connectionId = randomUUID().replaceAll("-", "");
  const url = `${WSS_URL}&ConnectionId=${connectionId}&Sec-MS-GEC=${secMsGec(skewSeconds)}&Sec-MS-GEC-Version=1-${CHROMIUM_VERSION}`;
  return new Promise<Buffer>((resolve, reject) => {
    const socket = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent":
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ` +
          `Chrome/${CHROMIUM_VERSION.split(".")[0]}.0.0.0 Safari/537.36 Edg/${CHROMIUM_VERSION.split(".")[0]}.0.0.0`,
        Cookie: `muid=${randomBytes(16).toString("hex").toUpperCase()};`,
      },
      perMessageDeflate: true,
    });
    const chunks: Buffer[] = [];
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      socket.close();
      reject(error);
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      socket.close();
      if (chunks.length === 0) {
        reject(new Error("在线语音没有返回声音。"));
        return;
      }
      resolve(Buffer.concat(chunks));
    };
    const timer = setTimeout(() => fail(new Error("在线语音超时。")), 20000);
    socket.on("open", () => {
      socket.send(speechConfig());
      socket.send(ssmlMessage(text, lang));
    });
    socket.on("message", (data, isBinary) => {
      const message = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (isBinary) {
        const chunk = audioChunk(message);
        if (chunk) chunks.push(chunk);
        return;
      }
      if (message.toString("utf8").includes("Path:turn.end")) succeed();
    });
    socket.on("unexpected-response", (_request, response) => {
      const serverDate = response.headers.date;
      const parsed = serverDate ? Date.parse(serverDate) : Number.NaN;
      const skew = Number.isNaN(parsed) ? null : parsed / 1000 - Date.now() / 1000;
      response.resume();
      clearTimeout(timer);
      fail(Object.assign(new Error("在线语音暂时不可用。"), { status: response.statusCode, skew }));
    });
    socket.on("error", () => fail(new Error("在线语音暂时不可用。")));
    socket.on("close", () => {
      clearTimeout(timer);
      if (!settled) succeed();
    });
  });
}

export async function synthesizeEdge(text: string, lang: SpeechLang) {
  try {
    return await connect(text, lang, 0);
  } catch (error) {
    const skew = error instanceof Error && "skew" in error ? Number(error.skew) : Number.NaN;
    if (!Number.isFinite(skew)) throw error;
    return connect(text, lang, skew);
  }
}
