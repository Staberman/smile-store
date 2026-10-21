"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * PROTOTIPO — Probador AR de anteojos.
 *
 * Usa MediaPipe Tasks Vision cargado desde CDN con `webpackIgnore: true`
 * para que webpack NO intente empaquetar el wasm/modelo. Detecta la cara
 * con la webcam y superpone un PNG transparente de los anteojos sobre la
 * línea de los ojos, escalado y rotado según los landmarks.
 *
 * No probado con cámara real por quien lo implementó: requiere que un humano
 * lo pruebe en un dispositivo con cámara.
 */

const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";
const WASM = `${CDN}/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Índices de landmarks (FaceMesh): esquinas externas de los ojos.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

type GlassesModel = {
  id: string;
  label: string;
  src: string;
};

const MODELS: GlassesModel[] = [
  { id: "rb-wayfarer", label: "Ray-Ban Wayfarer 2140", src: "/ar-demo/rb-wayfarer.png" },
  { id: "rb-round", label: "Ray-Ban Highstreet Round 2180", src: "/ar-demo/rb-round.png" },
  { id: "gucci", label: "Gucci GG1443S", src: "/ar-demo/gucci.png" },
];

type Status = "idle" | "loading" | "requesting" | "running" | "denied" | "error";

export default function ProbadorAR() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs de larga vida para el loop de animación y limpieza.
  const landmarkerRef = useRef<unknown>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const glassesImgRef = useRef<HTMLImageElement | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  type Pose = { cx: number; cy: number; w: number; h: number; angle: number };
  const targetPoseRef = useRef<Pose | null>(null);
  const drawPoseRef = useRef<Pose | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [selected, setSelected] = useState<number>(0);
  const [attempt, setAttempt] = useState<number>(0); // fuerza reintento

  // Precarga la imagen de los anteojos seleccionados (front PNG transparente).
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = MODELS[selected].src;
    img.onload = () => {
      glassesImgRef.current = img;
    };
    // Si falla la carga, dejamos el ref anterior; el loop simplemente no dibuja.
    return () => {
      img.onload = null;
    };
  }, [selected]);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current as
      | { detectForVideo: (v: HTMLVideoElement, ts: number) => { faceLandmarks?: { x: number; y: number }[][] } }
      | null;

    if (!video || !canvas || !landmarker) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    if (video.readyState >= 2 && video.videoWidth > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 1) Actualizar el objetivo SOLO cuando hay un cuadro de video nuevo.
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          try {
            const now = performance.now();
            const result = landmarker.detectForVideo(video, now);
            const faces = result?.faceLandmarks;
            if (faces && faces.length > 0) {
              const lm = faces[0];
              const p1 = lm[LEFT_EYE_OUTER];
              const p2 = lm[RIGHT_EYE_OUTER];
              if (p1 && p2) {
                const cw = canvas.width;
                const ch = canvas.height;
                const x1 = p1.x * cw;
                const y1 = p1.y * ch;
                const x2 = p2.x * cw;
                const y2 = p2.y * ch;
                const dx = x2 - x1;
                const dy = y2 - y1;
                targetPoseRef.current = {
                  cx: (x1 + x2) / 2,
                  cy: (y1 + y2) / 2,
                  w: Math.hypot(dx, dy) * 2.1,
                  h: 0,
                  angle: Math.atan2(dy, dx),
                };
              }
            }
          } catch {
            // Un fallo puntual de deteccion no rompe el loop.
          }
        }

        // 2) Dibujar SIEMPRE cada cuadro, suavizando hacia el objetivo, para
        //    que no parpadee en los cuadros sin deteccion nueva.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const target = targetPoseRef.current;
        const img = glassesImgRef.current;
        if (target && img && img.complete && img.naturalWidth > 0) {
          const aspect = img.naturalHeight / img.naturalWidth;
          const targetH = target.w * aspect;
          const prev = drawPoseRef.current;
          const t = prev ? 0.35 : 1;
          const cur: Pose = prev
            ? {
                cx: prev.cx + (target.cx - prev.cx) * t,
                cy: prev.cy + (target.cy - prev.cy) * t,
                w: prev.w + (target.w - prev.w) * t,
                h: prev.h + (targetH - prev.h) * t,
                angle: prev.angle + (target.angle - prev.angle) * t,
              }
            : { cx: target.cx, cy: target.cy, w: target.w, h: targetH, angle: target.angle };
          drawPoseRef.current = cur;

          ctx.save();
          ctx.translate(cur.cx, cur.cy + cur.h * 0.06);
          ctx.rotate(cur.angle);
          ctx.drawImage(img, -cur.w / 2, -cur.h / 2, cur.w, cur.h);
          ctx.restore();
        }
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const stopEverything = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    async function start() {
      setErrorMsg("");
      setStatus("loading");

      // 1) Carga MediaPipe desde CDN sin que webpack lo empaquete.
      let landmarker: unknown;
      try {
        // @ts-expect-error — import dinámico de una URL CDN (webpackIgnore).
        const vision = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18");
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(WASM);
        landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: MODEL },
          runningMode: "VIDEO",
          numFaces: 1,
        });
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            "No pudimos cargar el motor de reconocimiento facial. Verificá tu conexión a internet e intentá de nuevo."
          );
        }
        return;
      }
      if (cancelled) {
        // Si se desmontó mientras cargaba, liberamos.
        (landmarker as { close?: () => void })?.close?.();
        return;
      }
      landmarkerRef.current = landmarker;

      // 2) Pide la webcam (cámara frontal).
      setStatus("requesting");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      } catch (err) {
        if (cancelled) return;
        const name = (err as { name?: string })?.name ?? "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied");
          setErrorMsg(
            "Necesitamos permiso para usar la cámara. Habilitá el acceso en tu navegador y tocá «Reintentar»."
          );
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("denied");
          setErrorMsg(
            "No encontramos una cámara disponible en este dispositivo. Probá en un celular o notebook con cámara frontal."
          );
        } else {
          setStatus("error");
          setErrorMsg("No pudimos acceder a la cámara. Intentá de nuevo.");
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Autoplay puede requerir gesto del usuario en algunos navegadores.
      }

      if (cancelled) return;
      setStatus("running");
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    start();

    return () => {
      cancelled = true;
      stopEverything();
      const lm = landmarkerRef.current as { close?: () => void } | null;
      lm?.close?.();
      landmarkerRef.current = null;
      lastVideoTimeRef.current = -1;
    };
  }, [drawFrame, attempt]);

  const retry = () => {
    setAttempt((n) => n + 1);
  };

  const isBlocking = status === "denied" || status === "error";
  const isLoading = status === "loading" || status === "requesting" || status === "idle";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-10 sm:py-14">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#c9a96e]">Smile · Prototipo</p>
        <h1 className="font-display text-3xl font-light sm:text-4xl">Probador AR</h1>
        <p className="mt-3 max-w-md text-center text-sm text-[#b8b0a4]">
          Probate anteojos Ray-Ban en tiempo real con la cámara de tu dispositivo.
        </p>

        {/* Caja del video, responsive y espejada */}
        <div className="relative mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
          <div className="relative aspect-[3/4] w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Overlays de estado */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a96e] border-t-transparent" />
                <p className="text-sm text-[#e2c989]">
                  {status === "requesting" ? "Pedimos permiso para la cámara…" : "Cargando probador…"}
                </p>
              </div>
            )}

            {isBlocking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center">
                <p className="text-sm text-[#b8b0a4]">{errorMsg}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-full border border-[#c9a96e] px-6 py-2 text-sm text-[#e2c989] transition hover:bg-[#c9a96e] hover:text-black"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selector de modelos */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {MODELS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              className={`flex items-center gap-3 rounded-xl border px-4 py-2 text-left transition ${
                selected === i
                  ? "border-[#c9a96e] bg-[#c9a96e]/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.label} className="h-8 w-14 object-contain" />
              <span className="text-xs sm:text-sm">{m.label}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#8b8580]">
          Prototipo — funciona mejor de frente y con buena luz.
        </p>
      </div>
    </main>
  );
}
