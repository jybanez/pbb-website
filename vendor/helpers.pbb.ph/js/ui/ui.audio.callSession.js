import { createElement, clearNode } from "./ui.dom.js";
import { createAudioPlayer } from "./ui.audio.player.js";
import { createAudioGraph } from "./ui.audio.audiograph.js";

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Audio call session",
  debug: false,
  autoplay: false,
  baseUrl: "",
  audiographStyle: "vu",
  sensitivity: 3.4,
  roleStyles: {},
  showMute: true,
  onError: null,
  onStateChange: null,
};

export function createAudioCallSession(container, incident = {}, options = {}) {
  let currentIncident = incident || {};
  let currentOptions = normalizeOptions(options);
  let normalizedSession = null;

  let root = null;
  let playerHost = null;
  let tracksHost = null;
  let playerApi = null;
  const roleApis = new Map();

  let rafId = 0;
  let isPlaying = false;
  let currentMs = 0;
  let durationMs = 0;
  let clockBaseMs = 0;
  let clockStartPerf = 0;

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    clearNode(container);
    root = createElement("section", {
      className: `ui-audio-session ${currentOptions.className}`.trim(),
      attrs: {
        role: "region",
        "aria-label": currentOptions.ariaLabel,
      },
    });
    playerHost = createElement("div", { className: "ui-audio-session-player" });
    tracksHost = createElement("div", {
      className: "ui-audio-session-tracks",
      attrs: {
        role: "list",
        "aria-label": "Audio roles",
      },
    });
    root.append(playerHost, tracksHost);
    container.appendChild(root);
  }

  async function build() {
    cleanupInstances();
    normalizedSession = normalizeIncident(currentIncident, currentOptions.baseUrl);
    durationMs = Math.max(0, normalizedSession.durationMs || 0);
    currentMs = 0;
    isPlaying = false;

    playerApi = createAudioPlayer(
      playerHost,
      {
        isPlaying: false,
        currentMs: 0,
        durationMs,
      },
      {
        ariaLabel: "Call session playback controls",
        onTogglePlay(nextPlaying) {
          if (nextPlaying) {
            play();
          } else {
            pause();
          }
        },
        onSeek(nextMs) {
          seek(nextMs);
        },
      }
    );

    normalizedSession.roles.forEach((roleTrack) => {
      const trackWrap = createElement("div", {
        className: "ui-audio-session-track",
        dataset: { role: roleTrack.role },
        attrs: { role: "listitem" },
      });
      tracksHost.appendChild(trackWrap);

      const roleStyle = currentOptions.roleStyles[roleTrack.role] || currentOptions.audiographStyle;
      const graphApi = createAudioGraph(
        trackWrap,
        {
          role: roleTrack.role,
          roleLabel: roleTrack.roleLabel,
          muted: roleTrack.muted,
          isPlaying: false,
          currentMs: 0,
          durationMs,
        },
        {
          ariaLabel: `${roleTrack.roleLabel} audio graph`,
          style: roleStyle,
          sensitivity: currentOptions.sensitivity,
          showMute: currentOptions.showMute,
          onToggleMute(nextMuted) {
            roleTrack.muted = nextMuted;
            if (roleTrack.audioEl) {
              roleTrack.audioEl.muted = nextMuted;
            }
          },
        }
      );

      roleTrack.audioEl = createRoleAudioElement();
      roleTrack.audioEl.muted = roleTrack.muted;
      graphApi.attachAudio(roleTrack.audioEl);
      roleApis.set(roleTrack.role, graphApi);
    });

    await preloadDurations(normalizedSession, (error) => {
      currentOptions.onError?.(error);
    });
    durationMs = normalizedSession.durationMs;
    playerApi.setDuration(durationMs);
    roleApis.forEach((api) => {
      api.setPlayback({ isPlaying: false, currentMs: 0, durationMs });
    });

    if (currentOptions.autoplay) {
      play();
    }
    emitState();
  }

  function tick() {
    if (!isPlaying) {
      return;
    }
    currentMs = clampMs(clockBaseMs + (performance.now() - clockStartPerf), durationMs);
    syncAllRoles();
    playerApi.setCurrent(currentMs);
    roleApis.forEach((api) => {
      api.setPlayback({ isPlaying: true, currentMs, durationMs });
    });
    emitState();

    if (currentMs >= durationMs) {
      pause();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  async function play() {
    if (isPlaying) {
      return;
    }
    await Promise.all(
      Array.from(roleApis.values()).map((api) => api.unlockAudioContext?.() || Promise.resolve(false))
    );
    isPlaying = true;
    clockBaseMs = currentMs;
    clockStartPerf = performance.now();
    syncAllRoles();
    roleApis.forEach((api) => {
      api.setPlayback({ isPlaying: true, currentMs, durationMs });
    });
    playerApi.setPlaying(true);
    rafId = requestAnimationFrame(tick);
    emitState();
  }

  function pause() {
    if (!isPlaying) {
      return;
    }
    isPlaying = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    normalizedSession.roles.forEach((roleTrack) => {
      roleTrack.audioEl?.pause();
    });
    playerApi.setPlaying(false);
    roleApis.forEach((api) => {
      api.setPlayback({ isPlaying: false, currentMs, durationMs });
    });
    emitState();
  }

  function seek(nextMs) {
    currentMs = clampMs(nextMs, durationMs);
    if (isPlaying) {
      clockBaseMs = currentMs;
      clockStartPerf = performance.now();
    }
    syncAllRoles();
    playerApi.setCurrent(currentMs);
    roleApis.forEach((api) => {
      api.setPlayback({ isPlaying, currentMs, durationMs });
    });
    emitState();
  }

  function syncAllRoles() {
    if (!normalizedSession) {
      return;
    }
    normalizedSession.roles.forEach((roleTrack) => syncRole(roleTrack, currentMs, isPlaying));
  }

  function syncRole(roleTrack, timelineMs, shouldPlay) {
    const mediaEl = roleTrack.audioEl;
    if (!mediaEl) {
      return;
    }
    mediaEl.muted = Boolean(roleTrack.muted);
    const index = findSegmentIndexByTime(roleTrack.segments, timelineMs);
    if (index < 0) {
      mediaEl.pause();
      roleTrack.activeSegmentIndex = -1;
      return;
    }

    const segment = roleTrack.segments[index];
    const localMs = Math.max(0, timelineMs - segment.startOffsetMs);
    const localSec = localMs / 1000;

    if (roleTrack.activeSegmentIndex !== index || roleTrack.activeSrc !== segment.srcUrl) {
      roleTrack.activeSegmentIndex = index;
      roleTrack.activeSrc = segment.srcUrl;
      mediaEl.src = segment.srcUrl;
      syncMediaTime(mediaEl, localSec);
    } else {
      const drift = Math.abs((mediaEl.currentTime || 0) - localSec);
      if (drift > 0.2) {
        syncMediaTime(mediaEl, localSec);
      }
    }

    if (shouldPlay) {
      mediaEl.play?.().catch(() => {});
    } else {
      mediaEl.pause();
    }
  }

  function update(nextIncident = {}, nextOptions = {}) {
    currentIncident = nextIncident || {};
    currentOptions = normalizeOptions({ ...currentOptions, ...nextOptions });
    pause();
    return build();
  }

  function destroy() {
    pause();
    cleanupInstances();
    clearNode(container);
    root = null;
    playerHost = null;
    tracksHost = null;
  }

  function cleanupInstances() {
    if (playerApi) {
      playerApi.destroy();
      playerApi = null;
    }
    roleApis.forEach((api) => api.destroy());
    roleApis.clear();
    if (normalizedSession?.roles) {
      normalizedSession.roles.forEach((roleTrack) => {
        if (roleTrack.audioEl) {
          roleTrack.audioEl.pause();
          roleTrack.audioEl.src = "";
          roleTrack.audioEl.removeAttribute("src");
          roleTrack.audioEl.load();
          roleTrack.audioEl = null;
        }
      });
    }
  }

  function emitState() {
    currentOptions.onStateChange?.(getState());
  }

  function getState() {
    return {
      isPlaying,
      currentMs,
      durationMs,
      roles: (normalizedSession?.roles || []).map((roleTrack) => ({
        role: roleTrack.role,
        roleLabel: roleTrack.roleLabel,
        muted: roleTrack.muted,
        segments: roleTrack.segments.map((segment) => ({
          id: segment.id,
          callId: segment.callId,
          startOffsetMs: segment.startOffsetMs,
          durationMs: segment.durationMs,
          endOffsetMs: segment.endOffsetMs,
          srcUrl: segment.srcUrl,
        })),
      })),
    };
  }

  render();
  build().catch((error) => {
    currentOptions.onError?.(error);
  });

  return {
    destroy,
    update,
    play,
    pause,
    seek,
    getState,
  };
}

function normalizeOptions(options) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };
}

function normalizeIncident(incident, baseUrl) {
  const safeIncident = incident || {};
  const explicitDurationMs = Math.max(0, Math.round((Number(safeIncident.call_duration_seconds) || 0) * 1000));
  const mediaList = Array.isArray(safeIncident.media) ? safeIncident.media : [];
  const parsed = mediaList
    .filter((row) => String(row?.type || "").toLowerCase() === "audio")
    .map((row) => parseMediaRow(row, baseUrl))
    .filter(Boolean)
    .sort((a, b) => a.startAt - b.startAt);

  const rolesMap = new Map();
  parsed.forEach((segment) => {
    const role = segment.role;
    if (!rolesMap.has(role)) {
      rolesMap.set(role, {
        role,
        roleLabel: resolveRoleLabel(safeIncident, role),
        muted: false,
        segments: [],
        activeSegmentIndex: -1,
        activeSrc: "",
        audioEl: null,
      });
    }
    rolesMap.get(role).segments.push(segment);
  });

  const allStart = parsed.length ? parsed[0].startAt : 0;
  let maxEnd = 0;
  const roles = Array.from(rolesMap.values()).map((roleTrack) => {
    roleTrack.segments = roleTrack.segments.map((segment, index, list) => {
      const startOffsetMs = Math.max(0, segment.startAt - allStart);
      const next = list[index + 1];
      const nextStartOffsetMs = next ? Math.max(0, next.startAt - allStart) : null;
      const inferredGapMs = nextStartOffsetMs !== null
        ? Math.max(1000, nextStartOffsetMs - startOffsetMs)
        : 15000;
      const durationMs = Math.max(1, segment.durationMs || inferredGapMs);
      const endOffsetMs = startOffsetMs + durationMs;
      maxEnd = Math.max(maxEnd, endOffsetMs);
      return { ...segment, startOffsetMs, durationMs, endOffsetMs };
    });
    return roleTrack;
  });

  if (maxEnd <= 0 && roles.some((roleTrack) => roleTrack.segments.length > 0)) {
    maxEnd = 15000;
  }

  const computedDurationMs = maxEnd;
  return {
    roles,
    durationMs: explicitDurationMs > 0 ? explicitDurationMs : computedDurationMs,
    explicitDurationMs,
    baselineStartAt: allStart,
  };
}

async function preloadDurations(session, onError) {
  const tasks = [];
  session.roles.forEach((roleTrack) => {
    roleTrack.segments.forEach((segment) => {
      if (segment.durationMs > 0) {
        return;
      }
      tasks.push(
        loadAudioDurationMs(segment.srcUrl)
          .then((durationMs) => {
            segment.durationMs = Math.max(0, durationMs);
          })
          .catch((error) => {
            segment.durationMs = 0;
            onError?.(new Error(`Failed to load audio duration for ${segment.srcUrl}: ${error.message}`));
          })
      );
    });
  });
  if (!tasks.length) {
    return;
  }
  await Promise.all(tasks);
  let maxEnd = 0;
  session.roles.forEach((roleTrack) => {
    roleTrack.segments = roleTrack.segments.map((segment) => {
      const endOffsetMs = segment.startOffsetMs + Math.max(0, segment.durationMs || 0);
      maxEnd = Math.max(maxEnd, endOffsetMs);
      return { ...segment, endOffsetMs };
    });
  });
  session.durationMs = session.explicitDurationMs > 0
    ? session.explicitDurationMs
    : maxEnd;
}

function parseMediaRow(row, baseUrl) {
  const token = row?.metadata?.recording_role;
  if (typeof token !== "string") {
    return null;
  }
  const match = token.match(/^([a-zA-Z_]+)-([0-9]+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)$/);
  if (!match) {
    return null;
  }
  const role = String(match[1] || "").toLowerCase();
  const callId = String(match[2] || "");
  const timestampToken = match[3];
  const iso = timestampToken.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/,
    "$1T$2:$3:$4Z"
  );
  const startAt = Date.parse(iso);
  if (!Number.isFinite(startAt)) {
    return null;
  }
  const durationSeconds = Number(row?.duration_seconds);
  const durationMs = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? Math.round(durationSeconds * 1000)
    : 0;

  return {
    id: row?.id ?? null,
    role,
    callId,
    startAt,
    durationMs,
    srcUrl: resolveMediaPath(row?.path || "", baseUrl),
  };
}

function resolveRoleLabel(incident, role) {
  if (role === "caller") {
    return incident?.caller?.name || role;
  }
  if (role === "operator") {
    return incident?.operator?.name || role;
  }
  return role;
}

function resolveMediaPath(path, baseUrl) {
  const value = String(path || "").trim();
  if (!value) {
    return "";
  }
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("./")) {
    return value;
  }
  if (!baseUrl) {
    return `./${value}`;
  }
  return `${String(baseUrl).replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function createRoleAudioElement() {
  const audio = document.createElement("audio");
  audio.preload = "auto";
  audio.playsInline = true;
  audio.crossOrigin = "anonymous";
  return audio;
}

function findSegmentIndexByTime(segments, timelineMs) {
  for (let i = 0; i < segments.length; i += 1) {
    const item = segments[i];
    const next = segments[i + 1];
    const hardEnd = Number.isFinite(item.endOffsetMs) ? item.endOffsetMs : item.startOffsetMs;
    const inferredEnd = next ? next.startOffsetMs : Number.MAX_SAFE_INTEGER;
    const end = Math.max(hardEnd, inferredEnd);
    if (timelineMs >= item.startOffsetMs && timelineMs < end) {
      return i;
    }
  }
  return -1;
}

function syncMediaTime(mediaEl, seconds) {
  if (!Number.isFinite(seconds)) {
    return;
  }
  try {
    mediaEl.currentTime = Math.max(0, seconds);
  } catch (error) {
    const once = () => {
      try {
        mediaEl.currentTime = Math.max(0, seconds);
      } catch (innerError) {
        // no-op
      }
      mediaEl.removeEventListener("loadedmetadata", once);
    };
    mediaEl.addEventListener("loadedmetadata", once);
  }
}

function clampMs(value, max) {
  const safeValue = Math.max(0, Number(value) || 0);
  const safeMax = Math.max(0, Number(max) || 0);
  return Math.min(safeValue, safeMax);
}

function loadAudioDurationMs(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("Missing audio URL"));
      return;
    }
    const audio = document.createElement("audio");
    let done = false;
    const finalize = (fn) => {
      if (done) {
        return;
      }
      done = true;
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      clearTimeout(timer);
      fn();
    };
    const onLoaded = () => {
      const duration = Number(audio.duration);
      finalize(() => resolve(Number.isFinite(duration) && duration > 0 ? Math.round(duration * 1000) : 0));
    };
    const onError = () => {
      finalize(() => reject(new Error("Unable to load metadata")));
    };
    const timer = setTimeout(() => {
      finalize(() => reject(new Error("Timeout while loading metadata")));
    }, 8000);

    audio.preload = "metadata";
    audio.src = url;
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
  });
}
