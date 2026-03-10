import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Colors matching the reference images ────────────────────────────────────
const COLORS = [
    '#F5C035',  // yellow
    '#5B9BD5',  // blue
    '#D44F4A',  // red
    '#4BA650',  // green
    '#8B5CB5',  // purple
    '#9FADB8',  // gray
] as const;

const EYE_COLOR = '#1A0A0A';

// ─── Character layout ─────────────────────────────────────────────────────────
const N = COLORS.length;
const SPACING = 1.10;
const FINAL_X = COLORS.map((_, i) => -((N - 1) * SPACING) / 2 + i * SPACING);
const BASE_Y = -0.58;
const ENTRY_X_OFFSET = 16;

// ─── Simple spring physics ────────────────────────────────────────────────────
class Spring {
    pos: number;
    vel = 0;
    target: number;
    k: number;
    b: number;

    constructor(init: number, stiffness = 200, damping = 18) {
        this.pos = init;
        this.target = init;
        this.k = stiffness;
        this.b = damping;
    }

    step(dt: number): number {
        const d = Math.min(dt, 0.033);
        const f = (this.target - this.pos) * this.k - this.vel * this.b;
        this.vel += f * d;
        this.pos += this.vel * d;
        return this.pos;
    }
}

// ─── Shared toon gradient (module-level singleton) ────────────────────────────
let _toon: THREE.DataTexture | null = null;
function toonMap(): THREE.DataTexture {
    if (!_toon) {
        const data = new Uint8Array([80, 200, 255]);
        _toon = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
        _toon.minFilter = THREE.NearestFilter;
        _toon.magFilter = THREE.NearestFilter;
        _toon.needsUpdate = true;
    }
    return _toon;
}

// ─── Argonaut character ───────────────────────────────────────────────────────
interface ArgonautProps {
    color: string;
    finalX: number;
    idx: number;
}

const Argonaut = React.memo<ArgonautProps>(({ color, finalX, idx }) => {
    const groupRef  = useRef<THREE.Group>(null!);
    const bodyRef   = useRef<THREE.Mesh>(null!);
    const lArmRef   = useRef<THREE.Group>(null!);
    const rArmRef   = useRef<THREE.Group>(null!);
    const lLegRef   = useRef<THREE.Group>(null!);
    const rLegRef   = useRef<THREE.Group>(null!);
    const lEyeRef   = useRef<THREE.Mesh>(null!);
    const rEyeRef   = useRef<THREE.Mesh>(null!);

    const toon = useMemo(() => toonMap(), []);

    // ── Stable personality per character (no randomness after mount) ──────────
    const per = useMemo(() => ({
        // Entry timing: each character waits before walking in
        delay:       idx * 0.22,
        walkSpd:     4.8 + idx * 0.18,
        // Idle
        breathSpd:   1.0 + (idx % 3) * 0.22,
        breathAmt:   0.013 + (idx % 2) * 0.009,
        swaySpd:     0.48 + (idx % 4) * 0.14,
        swayAmt:     0.015 + (idx % 3) * 0.007,
        phase:       (idx / N) * Math.PI * 2,
        // Blink timing varies per character
        blinkEvery:  3.6 + idx * 0.55,
    }), [idx]);

    // ── Springs ───────────────────────────────────────────────────────────────
    const xSpr   = useRef(new Spring(finalX + ENTRY_X_OFFSET, 52, 10));
    // Left arm Z rotation: rest=+0.15, raised=+2.7 (counterclockwise swing up)
    const lArmSpr = useRef(new Spring(0.15, 240, 20));
    // Right arm Z rotation: rest=-0.15, raised=-2.7 (clockwise swing up)
    const rArmSpr = useRef(new Spring(-0.15, 240, 20));

    // ── All mutable state in a single ref (avoids stale closures) ────────────
    const st = useRef({
        startT:    -1,
        arrived:   false,
        hovered:   false,
        raiseLeft: true,
        lastBlink: -1,
        blinking:  false,
        blinkT:    0,
    });

    useFrame((state, delta) => {
        const t  = state.clock.getElapsedTime();
        const s  = st.current;

        // Initialize on first frame
        if (s.startT < 0) {
            s.startT    = t;
            s.lastBlink = t + per.delay + per.blinkEvery * 0.6 + idx * 0.4;
        }

        // Wait for staggered entry delay
        if (t - s.startT < per.delay) return;

        // ── Entry: spring X toward final position ─────────────────────────
        xSpr.current.target = finalX;
        const cx = xSpr.current.step(delta);
        groupRef.current.position.x = cx;

        const dist    = Math.abs(cx - finalX);
        const walking = dist > 0.07;
        if (!walking && !s.arrived) s.arrived = true;

        // ── Walk animation ────────────────────────────────────────────────
        const elapsed = t - s.startT;
        if (walking) {
            const wt = elapsed * per.walkSpd;
            lLegRef.current.rotation.x  =  Math.sin(wt)           * 0.48;
            rLegRef.current.rotation.x  =  Math.sin(wt + Math.PI)  * 0.48;
            lArmRef.current.rotation.x  =  Math.sin(wt + Math.PI)  * 0.22;
            rArmRef.current.rotation.x  =  Math.sin(wt)            * 0.22;
            // Subtle walk bob
            groupRef.current.position.y = Math.abs(Math.sin(wt * 2)) * 0.04 + BASE_Y;
        }

        // ── Idle animations ───────────────────────────────────────────────
        if (s.arrived) {
            // Dampen walk cycles
            lLegRef.current.rotation.x *= 0.84;
            rLegRef.current.rotation.x *= 0.84;
            lArmRef.current.rotation.x *= 0.84;
            rArmRef.current.rotation.x *= 0.84;

            // Breathing (body scale XY anti-phase for volume conservation feel)
            const bt = t * per.breathSpd + per.phase;
            const breathV = Math.sin(bt);
            bodyRef.current.scale.y =  1 + breathV * per.breathAmt * 2;
            bodyRef.current.scale.x =  1 - breathV * per.breathAmt * 0.5;

            // Float (very subtle)
            groupRef.current.position.y = BASE_Y + Math.sin(bt * 0.5) * 0.011;

            // Sway
            groupRef.current.rotation.z = Math.sin(t * per.swaySpd + per.phase) * per.swayAmt;

            // ── Eye blink ─────────────────────────────────────────────────
            if (t > s.lastBlink && !s.blinking) {
                s.blinking = true;
                s.blinkT   = t;
                s.lastBlink = t + per.blinkEvery + (idx % 3) * 0.4;
            }
            if (s.blinking) {
                const bf  = (t - s.blinkT) / 0.13;  // 0.13s total blink
                const sc  = bf < 0.5
                    ? 1  - bf * 2  * 0.92      // close
                    : 0.08 + (bf - 0.5) * 2 * 0.92;  // open
                const esc = Math.max(0.06, Math.min(1, sc));
                lEyeRef.current.scale.y = esc;
                rEyeRef.current.scale.y = esc;
                if (bf >= 1) {
                    s.blinking = false;
                    lEyeRef.current.scale.y = 1;
                    rEyeRef.current.scale.y = 1;
                }
            }

            // ── Arm raise spring ──────────────────────────────────────────
            const wave = s.hovered ? Math.sin(t * 7.8) * 0.17 : 0;

            lArmSpr.current.target = s.hovered && s.raiseLeft  ?  2.72 + wave : 0.15;
            rArmSpr.current.target = s.hovered && !s.raiseLeft ? -2.72 - wave : -0.15;

            lArmRef.current.rotation.z = lArmSpr.current.step(delta);
            rArmRef.current.rotation.z = rArmSpr.current.step(delta);
        }
    });

    // ── Hover handlers ────────────────────────────────────────────────────────
    const onEnter = () => {
        st.current.raiseLeft = Math.random() > 0.5;
        st.current.hovered   = true;
    };
    const onLeave = () => { st.current.hovered = false; };

    return (
        <group ref={groupRef} position={[finalX + ENTRY_X_OFFSET, BASE_Y, 0]}>
            <group onPointerEnter={onEnter} onPointerLeave={onLeave}>

                {/* ── Body (slightly elongated sphere → blob/egg shape) ── */}
                <mesh ref={bodyRef} scale={[1, 1.32, 0.92]}>
                    <sphereGeometry args={[0.34, 28, 28]} />
                    <meshToonMaterial color={color} gradientMap={toon} />
                </mesh>

                {/* ── Eyes ── */}
                <mesh ref={lEyeRef} position={[-0.115, 0.22, 0.305]}>
                    <sphereGeometry args={[0.053, 10, 10]} />
                    <meshToonMaterial color={EYE_COLOR} gradientMap={toon} />
                </mesh>
                <mesh ref={rEyeRef} position={[0.115, 0.22, 0.305]}>
                    <sphereGeometry args={[0.053, 10, 10]} />
                    <meshToonMaterial color={EYE_COLOR} gradientMap={toon} />
                </mesh>

                {/* ── Left arm (pivot at shoulder, arm hangs down) ── */}
                <group ref={lArmRef} position={[-0.37, 0.12, 0]}>
                    <mesh position={[0, -0.16, 0]}>
                        <capsuleGeometry args={[0.085, 0.18, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

                {/* ── Right arm ── */}
                <group ref={rArmRef} position={[0.37, 0.12, 0]}>
                    <mesh position={[0, -0.16, 0]}>
                        <capsuleGeometry args={[0.085, 0.18, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

                {/* ── Left leg ── */}
                <group ref={lLegRef} position={[-0.125, -0.44, 0]}>
                    <mesh position={[0, -0.13, 0]}>
                        <capsuleGeometry args={[0.085, 0.14, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

                {/* ── Right leg ── */}
                <group ref={rLegRef} position={[0.125, -0.44, 0]}>
                    <mesh position={[0, -0.13, 0]}>
                        <capsuleGeometry args={[0.085, 0.14, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

            </group>
        </group>
    );
});

Argonaut.displayName = 'Argonaut';

// ─── Scene (lights + characters) ─────────────────────────────────────────────
const Scene: React.FC = () => (
    <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 6, 5]} intensity={0.7} />
        {COLORS.map((color, i) => (
            <Argonaut
                key={color}
                color={color}
                finalX={FINAL_X[i]}
                idx={i}
            />
        ))}
    </>
);

// ─── Canvas wrapper ───────────────────────────────────────────────────────────
export const ArgonautsScene: React.FC = () => (
    <Canvas
        orthographic
        camera={{ zoom: 80, position: [0, 0, 10], near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        frameloop="always"
    >
        <Scene />
    </Canvas>
);
