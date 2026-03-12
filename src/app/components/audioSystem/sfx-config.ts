export type SynthPreset = {
  waveform: OscillatorType;
  frequency: number;
  frequencyEnd?: number;
  gain: number;
  durationMs: number;
  attackMs?: number;
  releaseMs?: number;
  noiseMix?: number;
};

export const SAMPLE_LIBRARY = {
  btn_default_click: { waveform: 'square', frequency: 720, frequencyEnd: 520, gain: 0.22, durationMs: 52, attackMs: 2, releaseMs: 32 },
  btn_secondary_click: { waveform: 'square', frequency: 640, frequencyEnd: 460, gain: 0.2, durationMs: 56, attackMs: 2, releaseMs: 34 },
  btn_outline_click: { waveform: 'triangle', frequency: 580, frequencyEnd: 430, gain: 0.18, durationMs: 54, attackMs: 2, releaseMs: 30 },
  btn_destructive_click: { waveform: 'square', frequency: 390, frequencyEnd: 230, gain: 0.22, durationMs: 72, attackMs: 2, releaseMs: 46, noiseMix: 0.06 },
  btn_ghost_click: { waveform: 'triangle', frequency: 780, frequencyEnd: 610, gain: 0.11, durationMs: 40, attackMs: 1, releaseMs: 22 },
  btn_link_click: { waveform: 'sine', frequency: 920, frequencyEnd: 1140, gain: 0.1, durationMs: 34, attackMs: 1, releaseMs: 20 },
  btn_icon_click: { waveform: 'square', frequency: 880, frequencyEnd: 690, gain: 0.12, durationMs: 32, attackMs: 1, releaseMs: 16 },
  btn_submit_click: { waveform: 'square', frequency: 760, frequencyEnd: 430, gain: 0.21, durationMs: 64, attackMs: 2, releaseMs: 38 },
  btn_disabled_click: { waveform: 'sawtooth', frequency: 220, frequencyEnd: 150, gain: 0.08, durationMs: 60, attackMs: 2, releaseMs: 38 },
  nav_route_transition: { waveform: 'triangle', frequency: 420, frequencyEnd: 760, gain: 0.13, durationMs: 96, attackMs: 2, releaseMs: 72 },
  modal_open: { waveform: 'square', frequency: 350, frequencyEnd: 660, gain: 0.16, durationMs: 86, attackMs: 2, releaseMs: 58 },
  modal_close: { waveform: 'square', frequency: 690, frequencyEnd: 300, gain: 0.14, durationMs: 84, attackMs: 2, releaseMs: 54 },
  toast_success: { waveform: 'square', frequency: 590, frequencyEnd: 920, gain: 0.18, durationMs: 118, attackMs: 2, releaseMs: 82 },
  toast_info: { waveform: 'triangle', frequency: 470, frequencyEnd: 720, gain: 0.15, durationMs: 108, attackMs: 2, releaseMs: 78 },
  toast_warning: { waveform: 'square', frequency: 520, frequencyEnd: 350, gain: 0.18, durationMs: 126, attackMs: 2, releaseMs: 90, noiseMix: 0.04 },
  toast_error: { waveform: 'sawtooth', frequency: 340, frequencyEnd: 160, gain: 0.19, durationMs: 146, attackMs: 2, releaseMs: 104, noiseMix: 0.06 },
  battle_attack_select: { waveform: 'square', frequency: 620, frequencyEnd: 780, gain: 0.18, durationMs: 74, attackMs: 2, releaseMs: 50 },
  battle_hit: { waveform: 'square', frequency: 210, frequencyEnd: 110, gain: 0.24, durationMs: 96, attackMs: 1, releaseMs: 64, noiseMix: 0.09 },
  battle_crit: { waveform: 'square', frequency: 840, frequencyEnd: 430, gain: 0.25, durationMs: 146, attackMs: 2, releaseMs: 100, noiseMix: 0.08 },
  battle_miss: { waveform: 'triangle', frequency: 760, frequencyEnd: 190, gain: 0.14, durationMs: 110, attackMs: 2, releaseMs: 80 },
  battle_capture_throw: { waveform: 'sine', frequency: 280, frequencyEnd: 760, gain: 0.15, durationMs: 132, attackMs: 2, releaseMs: 90 },
  battle_capture_success: { waveform: 'square', frequency: 520, frequencyEnd: 980, gain: 0.2, durationMs: 176, attackMs: 2, releaseMs: 112 },
  battle_capture_fail: { waveform: 'sawtooth', frequency: 300, frequencyEnd: 150, gain: 0.17, durationMs: 132, attackMs: 2, releaseMs: 90, noiseMix: 0.05 },
  battle_ko: { waveform: 'sawtooth', frequency: 250, frequencyEnd: 60, gain: 0.25, durationMs: 220, attackMs: 2, releaseMs: 158, noiseMix: 0.11 },
  progress_unlock: { waveform: 'square', frequency: 520, frequencyEnd: 1020, gain: 0.2, durationMs: 188, attackMs: 2, releaseMs: 120 },
  coins_gain: { waveform: 'square', frequency: 700, frequencyEnd: 1120, gain: 0.16, durationMs: 84, attackMs: 1, releaseMs: 52 },
  coins_spend: { waveform: 'triangle', frequency: 620, frequencyEnd: 350, gain: 0.16, durationMs: 84, attackMs: 1, releaseMs: 56 },
  system_error: { waveform: 'sawtooth', frequency: 280, frequencyEnd: 120, gain: 0.2, durationMs: 164, attackMs: 2, releaseMs: 112, noiseMix: 0.08 }
} as const satisfies Record<string, SynthPreset>;

export const EVENT_TO_SAMPLE = {
  'ui.button.default.click': 'btn_default_click',
  'ui.button.secondary.click': 'btn_secondary_click',
  'ui.button.outline.click': 'btn_outline_click',
  'ui.button.destructive.click': 'btn_destructive_click',
  'ui.button.ghost.click': 'btn_ghost_click',
  'ui.button.link.click': 'btn_link_click',
  'ui.button.icon.click': 'btn_icon_click',
  'ui.button.submit.click': 'btn_submit_click',
  'ui.button.disabled.click': 'btn_disabled_click',

  'nav.link.click': 'btn_link_click',
  'nav.menu.open': 'modal_open',
  'nav.menu.close': 'modal_close',
  'nav.route.leave': 'nav_route_transition',
  'nav.route.enter': 'nav_route_transition',
  'nav.route.auth.enter': 'modal_open',
  'nav.route.dashboard.enter': 'progress_unlock',
  'nav.route.battle.enter': 'battle_attack_select',
  'nav.route.shop.enter': 'coins_spend',
  'nav.route.collection.enter': 'toast_info',

  'form.input.focus': 'btn_ghost_click',
  'form.input.blur': 'btn_ghost_click',
  'form.input.type': 'btn_icon_click',
  'form.select.change': 'btn_outline_click',
  'form.checkbox.toggle.on': 'toast_success',
  'form.checkbox.toggle.off': 'toast_info',
  'form.submit.success': 'toast_success',
  'form.submit.error': 'toast_error',

  'modal.open': 'modal_open',
  'modal.close': 'modal_close',
  'toast.success': 'toast_success',
  'toast.info': 'toast_info',
  'toast.warning': 'toast_warning',
  'toast.error': 'toast_error',
  'alert.destructive.show': 'system_error',
  'loading.start': 'btn_ghost_click',
  'loading.stop': 'toast_info',

  'battle.attack.select': 'battle_attack_select',
  'battle.attack.hit': 'battle_hit',
  'battle.attack.crit': 'battle_crit',
  'battle.attack.miss': 'battle_miss',
  'battle.turn.pass': 'btn_secondary_click',
  'battle.flee': 'btn_destructive_click',
  'battle.capture.throw': 'battle_capture_throw',
  'battle.capture.success': 'battle_capture_success',
  'battle.capture.fail': 'battle_capture_fail',
  'battle.card.switch': 'btn_outline_click',
  'battle.card.ko': 'battle_ko',
  'battle.reward.claim': 'progress_unlock',

  'economy.coins.gain': 'coins_gain',
  'economy.coins.spend': 'coins_spend',
  'progress.unlock': 'progress_unlock',
  'progress.levelup': 'progress_unlock',
  'progress.certification.success': 'progress_unlock',

  'system.login.success': 'toast_success',
  'system.login.error': 'toast_error',
  'system.logout': 'btn_outline_click',
  'system.network.offline': 'system_error',
  'system.network.online': 'toast_success',
  'system.api.error': 'system_error'
} as const;

export type SampleId = keyof typeof SAMPLE_LIBRARY;
export type SfxEventId = keyof typeof EVENT_TO_SAMPLE;

export const DEFAULT_SFX_COOLDOWN_MS = 40;

export const ROUTE_ENTER_OVERRIDES: Array<[RegExp, SfxEventId]> = [
  [/^\/auth(?:$|\/)/, 'nav.route.auth.enter'],
  [/^\/dashboard(?:$|\/)/, 'nav.route.dashboard.enter'],
  [/^\/battle(?:$|\/)/, 'nav.route.battle.enter'],
  [/^\/shop(?:$|\/)/, 'nav.route.shop.enter'],
  [/^\/collection(?:$|\/)/, 'nav.route.collection.enter']
];
