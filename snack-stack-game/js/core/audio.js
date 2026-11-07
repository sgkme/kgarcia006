// Snack Stack \u2014 AudioManager: synthesized SFX + light looping music (WebAudio, no asset files).
// Godot port: AudioManager autoload with AudioStreamPlayer pools; keep the same cue IDs.
window.SS = window.SS || {};

SS.Audio = (function () {
  let ac = null, master = null, musicGain = null, musicTimer = null, step = 0;
  function ensure() {
    if (ac) return ac;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination); musicGain = ac.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master); } catch (e) { ac = null; }
    return ac;
  }
  function unlock() { const a = ensure(); if (a && a.state === "suspended") a.resume(); if (SS.Save.d.settings.music) startMusic(); }
  function tone(freq, dur, type, vol, slideTo, delay, dest) {
    if (!ac) return; const t0 = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, filterFreq, delay) {
    if (!ac) return; const t0 = ac.currentTime + (delay || 0);
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filterFreq || 1200;
    const g = ac.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }
  const CUES = {
    catch_perfect() { tone(880, 0.12, "triangle", 0.35); tone(1320, 0.18, "triangle", 0.28, null, 0.06); tone(1760, 0.2, "sine", 0.15, null, 0.12); },
    catch_good() { tone(660, 0.12, "triangle", 0.32); tone(990, 0.14, "triangle", 0.2, null, 0.05); },
    catch_messy() { tone(440, 0.14, "square", 0.12); noise(0.08, 0.15, 900); },
    catch_danger() { tone(300, 0.2, "sawtooth", 0.14, 220); noise(0.12, 0.2, 700); },
    whoosh() { noise(0.22, 0.35, 2600); tone(900, 0.18, "sine", 0.08, 300); },
    wrong() { tone(220, 0.16, "square", 0.18, 160); tone(180, 0.2, "square", 0.14, 120, 0.1); },
    miss() { tone(330, 0.25, "triangle", 0.2, 140); },
    hazard() { noise(0.25, 0.4, 600); tone(150, 0.3, "sawtooth", 0.15, 90); },
    bonus() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.14, "triangle", 0.22, null, i * 0.05)); },
    shield() { tone(520, 0.3, "sine", 0.25, 1040); },
    warn() { tone(740, 0.1, "square", 0.12); tone(740, 0.1, "square", 0.12, null, 0.16); },
    wind() { noise(0.9, 0.25, 500); },
    rumble() { noise(0.6, 0.5, 180); },
    collapse() { noise(0.5, 0.5, 400); tone(200, 0.5, "sawtooth", 0.15, 60); },
    save() { [523, 659, 784].forEach((f, i) => tone(f, 0.16, "triangle", 0.25, null, i * 0.06)); },
    order() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.25, null, i * 0.08)); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, "triangle", 0.25, null, i * 0.1)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.3, "triangle", 0.22, null, i * 0.15)); },
    click() { tone(1200, 0.05, "sine", 0.15); },
    coin() { tone(1568, 0.08, "square", 0.08); tone(2093, 0.12, "square", 0.08, null, 0.06); },
    levelup() { [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.22, "triangle", 0.25, null, i * 0.09)); }
  };
  function play(id) { if (!SS.Save.d.settings.sfx) return; if (!ensure()) return; const f = CUES[id]; if (f) try { f(); } catch (e) { } }
  // Tiny bouncy loop: bass + melody on a pentatonic scale.
  const MEL = [0, 4, 7, 9, 7, 4, 2, 4, 0, 2, 4, 7, 9, 12, 9, 7], BASS = [0, 0, 5, 5, 7, 7, 5, 5];
  function startMusic() {
    if (!ensure() || musicTimer) return;
    const base = 392, beat = 0.2;
    musicTimer = setInterval(() => {
      if (!SS.Save.d.settings.music || document.hidden) return;
      const m = MEL[step % MEL.length], b = BASS[Math.floor(step / 2) % BASS.length];
      if (step % 2 === 0) tone(base / 2 * Math.pow(2, b / 12), beat * 1.8, "triangle", 0.35, null, 0, musicGain);
      if (step % 4 !== 3) tone(base * Math.pow(2, m / 12), beat * 0.9, "square", 0.12, null, 0, musicGain);
      step++;
    }, 200);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  function haptic(ms) { if (SS.Save.d.settings.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }
  return { unlock, play, startMusic, stopMusic, haptic };
})();
