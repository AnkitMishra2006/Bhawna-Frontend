import { useEffect, useRef, type RefObject } from "react";

export function useFrameCapture(
  videoRef: RefObject<HTMLVideoElement | null>,
  onFrame: (base64: string, timestamp: number) => void,
  active: boolean,
  intervalMs: number = 120,
) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;
      if (!video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      onFrameRef.current(base64, video.currentTime);
    }, intervalMs);

    return () => clearInterval(id);
  }, [active, intervalMs, videoRef]);
}
