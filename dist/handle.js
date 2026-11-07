'use strict';

class RotaryHandle {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.value = 0;
    this.locked = false;
    this.pointer = null;
    this.keys = new Set();
    container.classList.add('rotary-handle');
    container.innerHTML = `
      <div class="rh-top"><strong>발사 손잡이</strong><span class="rh-readout"><b>0</b>%</span></div>
      <div class="rh-instrument">
        <div class="rh-dial" tabindex="0" role="slider" aria-label="발사 손잡이" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="rh-scale"></div><div class="rh-rotor"><div class="rh-face"></div><div class="rh-index"></div><div class="rh-grip"></div></div>
        </div>
        <div class="rh-marks" aria-hidden="true"><span>정지</span><span>우타</span></div>
      </div>
      <div class="rh-lock-row"><span>손잡이 고정</span><button type="button" class="rh-lock" role="switch" aria-label="손잡이 고정" aria-checked="false"><i></i></button></div>
      <p class="rh-hint">시계 방향으로 돌려 발사하고, 끝까지 돌려 우타하세요.</p>`;
    this.dial = container.querySelector('.rh-dial');
    this.readout = container.querySelector('.rh-readout b');
    this.lockButton = container.querySelector('.rh-lock');
    this.dial.title = '방향키로 강도 조절 · End로 우타 · Space로 고정';
    this.dial.addEventListener('pointerdown', event => this.startDrag(event));
    this.dial.addEventListener('pointermove', event => this.drag(event));
    this.dial.addEventListener('pointerup', event => this.endDrag(event));
    this.dial.addEventListener('pointercancel', event => this.endDrag(event));
    this.dial.addEventListener('lostpointercapture', event => this.endDrag(event));
    this.dial.addEventListener('keydown', event => this.keyDown(event));
    this.dial.addEventListener('keyup', event => {
      if (!this.keys.delete(event.key)) return;
      event.preventDefault();
      this.release();
    });
    this.dial.addEventListener('blur', () => {
      this.keys.clear();
      this.release();
    });
    this.lockButton.addEventListener('click', () => this.setLock(!this.locked));
    this.dial.setAttribute('aria-valuetext', '정지');
  }

  setValue(value) {
    const next = Math.min(100, Math.max(0, Math.round(value)));
    if (next === this.value) return;
    this.value = next;
    this.dial.style.setProperty('--rh-angle', `${-122 + next * 2.44}deg`);
    this.dial.style.setProperty('--rh-sweep', `${next * 2.44}deg`);
    this.container.classList.toggle('rh-right', next >= 95);
    this.readout.textContent = next;
    this.dial.setAttribute('aria-valuenow', next);
    this.dial.setAttribute('aria-valuetext', next === 0 ? '정지' : `${next}%, ${next >= 95 ? '우타' : '일반 발사'}`);
    this.onChange(next);
  }

  setLock(locked) {
    this.locked = locked;
    this.lockButton.setAttribute('aria-checked', String(locked));
    this.release();
  }

  point(event) {
    const rect = this.dial.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    return {x, y, angle: Math.atan2(x, -y) * 180 / Math.PI, radius: Math.hypot(x, y) / (rect.width / 2)};
  }

  startDrag(event) {
    if (event.button !== 0 || this.pointer !== null || this.container.inert) return;
    event.preventDefault();
    this.dial.focus({preventScroll: true});
    const p = this.point(event);
    const onScale = p.radius >= .81;
    if (onScale && Math.abs(p.angle) <= 140) this.setValue((p.angle + 122) / 2.44);
    this.pointer = {id: event.pointerId, p, angle: p.angle, value: this.value, radial: p.radius > .45};
    this.dial.classList.add('rh-dragging');
    this.dial.setPointerCapture(event.pointerId);
  }

  drag(event) {
    const current = this.pointer;
    if (!current || current.id !== event.pointerId) return;
    const p = this.point(event);
    if (current.radial) {
      if (p.radius < .18) { current.angle = p.angle; return; }
      // Unwrap the angle when the pointer crosses the bottom of the dial.
      const delta = (p.angle - current.angle + 540) % 360 - 180;
      current.value = Math.min(100, Math.max(0, current.value + delta / 2.44));
      current.angle = p.angle;
      this.setValue(current.value);
    } else {
      const distance = (p.x - current.p.x) + (current.p.y - p.y);
      this.setValue(current.value + distance / 1.1);
    }
  }

  endDrag(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    this.pointer = null;
    this.dial.classList.remove('rh-dragging');
    this.release();
  }

  keyDown(event) {
    if (event.code === 'Space' || event.key.toLowerCase() === 'l') {
      event.preventDefault();
      if (!event.repeat) this.setLock(!this.locked);
      return;
    }
    const step = event.shiftKey ? 10 : 2;
    const values = {ArrowRight: this.value + step, ArrowUp: this.value + step, ArrowLeft: this.value - step,
      ArrowDown: this.value - step, PageUp: this.value + 10, PageDown: this.value - 10, Home: 0, End: 100};
    if (!(event.key in values)) return;
    event.preventDefault();
    this.keys.add(event.key);
    this.setValue(values[event.key]);
  }

  release() {
    if (!this.locked && !this.pointer && this.keys.size === 0) this.setValue(0);
  }

  reset() {
    const id = this.pointer?.id;
    this.pointer = null;
    if (id !== undefined && this.dial.hasPointerCapture(id)) this.dial.releasePointerCapture(id);
    this.dial.classList.remove('rh-dragging');
    this.keys.clear();
    this.setLock(false);
  }
}

window.RotaryHandle = RotaryHandle;
