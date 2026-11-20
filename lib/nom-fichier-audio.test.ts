import { describe, expect, it } from "vitest";
import { nomFichierAudio } from "./nom-fichier-audio";

describe("nomFichierAudio", () => {
  it("Safari (mp4) → .m4a", () => {
    expect(nomFichierAudio("audio/mp4")).toBe("recording.m4a");
    expect(nomFichierAudio("audio/mp4;codecs=mp4a.40.2")).toBe("recording.m4a");
  });
  it("Chrome (webm) → .webm", () => {
    expect(nomFichierAudio("audio/webm;codecs=opus")).toBe("recording.webm");
  });
  it("ogg → .ogg", () => {
    expect(nomFichierAudio("audio/ogg;codecs=opus")).toBe("recording.ogg");
  });
  it("type inconnu ou absent → .webm comme avant", () => {
    expect(nomFichierAudio("")).toBe("recording.webm");
    expect(nomFichierAudio(undefined)).toBe("recording.webm");
  });
});
