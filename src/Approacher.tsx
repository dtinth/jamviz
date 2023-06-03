export interface Approacher {
  time: number;
  tick: number;
  current: number;
  speed: number;
}

export function createApproacher(): Approacher {
  return {
    time: 0,
    tick: 0,
    current: 0,
    speed: 0,
  };
}

export function approach(
  approacher: Approacher,
  target: number,
  deltaTime: number
): number {
  if (Math.abs(target - approacher.current) < 0.0001) {
    approacher.current = target;
    approacher.speed = 0;
    return target;
  }
  approacher.time += deltaTime;
  const targetTick = Math.floor(approacher.time / 2);
  const iterations = Math.max(0, Math.min(targetTick - approacher.tick, 50));
  for (let i = 0; i < iterations; i++) {
    const moveAmount = (target - approacher.current) * 0.01;
    const sign = Math.sign(moveAmount);
    let speed = Math.abs(moveAmount);
    const maxSpeed = approacher.speed + 0.00004;
    if (speed > maxSpeed) {
      speed = maxSpeed;
    }
    approacher.current += speed * sign;
    approacher.speed = speed;
  }
  approacher.tick = targetTick;
  return approacher.current;
}
