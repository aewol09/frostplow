/**
 * Unified Input Controller: handles keyboard, edge-triggers, and touch controls.
 * Automatically clears keys on blur/visibilitychange to prevent stuck inputs.
 */

export interface InputState {
  throttle: number; // -1 (reverse) to 1 (forward)
  steer: number;    // -1 (left) to 1 (right)
  boost: boolean;
  justPressedUpgrades: boolean;
  justPressedPause: boolean;
  justPressedMute: boolean;
  justPressedRestart: boolean;
  justPressedStart: boolean;
}

export class ControlsManager {
  private keysHeld = new Set<string>();
  private justPressedKeys = new Set<string>();

  // Virtual touch input overrides
  private touchThrottle: number = 0;
  private touchSteer: number = 0;
  private touchBoost: boolean = false;

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Avoid stealing browser shortcuts
    if (e.key === 'F12' || (e.ctrlKey && e.key === 'r')) return;

    // Prevent default scroll on arrow keys and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) {
      e.preventDefault();
    }

    if (!this.keysHeld.has(e.code)) {
      this.justPressedKeys.add(e.code);
    }
    this.keysHeld.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handleBlur = () => {
    this.keysHeld.clear();
    this.justPressedKeys.clear();
    this.touchThrottle = 0;
    this.touchSteer = 0;
    this.touchBoost = false;
  };

  public setTouchThrottle(val: number) {
    this.touchThrottle = val;
  }

  public setTouchSteer(val: number) {
    this.touchSteer = val;
  }

  public setTouchBoost(active: boolean) {
    this.touchBoost = active;
  }

  /**
   * Sample inputs and reset single-frame edge triggers.
   */
  public getInputs(): InputState {
    let throttle = 0;
    let steer = 0;

    // Keyboard Forward / Reverse
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) throttle += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) throttle -= 1;

    // Keyboard Steer Left / Right
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) steer -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) steer += 1;

    // Combine with virtual touch
    if (this.touchThrottle !== 0) throttle = this.touchThrottle;
    if (this.touchSteer !== 0) steer = this.touchSteer;

    // Boost
    const boost =
      this.keysHeld.has('Space') ||
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight') ||
      this.touchBoost;

    // Edge triggers
    const justPressedUpgrades = this.justPressedKeys.has('KeyU');
    const justPressedPause = this.justPressedKeys.has('Escape') || this.justPressedKeys.has('KeyP');
    const justPressedMute = this.justPressedKeys.has('KeyM');
    const justPressedRestart = this.justPressedKeys.has('KeyR');
    const justPressedStart =
      this.justPressedKeys.has('Enter') || this.justPressedKeys.has('Space');

    // Clear edge triggers for next frame
    this.justPressedKeys.clear();

    return {
      throttle,
      steer,
      boost,
      justPressedUpgrades,
      justPressedPause,
      justPressedMute,
      justPressedRestart,
      justPressedStart,
    };
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleBlur);
  }
}
