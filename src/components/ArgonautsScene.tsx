import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = [
    '#F5C035',  // yellow
    '#5B9BD5',  // blue
    '#D44F4A',  // red
    '#4BA650',  // green
    '#8B5CB5',  // purple
    '#9FADB8',  // gray
] as const;

const EYE_COLOR = '#1A0A0A';

// ─── Layout ───────────────────────────────────────────────────────────────────
const N = COLORS.length;
const SPACING = 1.15;
const FINAL_X = COLORS.map((_, i) => -((N - 1) * SPACING) / 2 + i * SPACING);
const BASE_Y  = -0.58;
const ENTRY_X_OFFSET = 16;
const BODY_R  = 0.34;   // base sphere radius (scale gives shape variation)

// ─── Per-character shape variants ─────────────────────────────────────────────
// bsx/bsy/bsz  body scale X/Y/Z
// ax/ay        arm pivot position (shoulder)
// ar/al        arm capsule radius / length
// lx/ly        leg pivot position (hip)
// lr/ll        leg capsule radius / length
// ex/ey/ez/er  eye offset X/Y/Z and radius
const SHAPES = [
    // 0: Yellow — tall and slim
    { bsx: 0.90, bsy: 1.65, bsz: 0.84,
      ax: 0.33, ay: 0.18,  ar: 0.068, al: 0.13,
      lx: 0.094, ly: -0.49, lr: 0.072, ll: 0.10,
      ex: 0.098, ey: 0.34, ez: 0.26, er: 0.046 },
    // 1: Blue — medium, slightly wide
    { bsx: 1.10, bsy: 1.28, bsz: 0.90,
      ax: 0.40, ay: 0.13,  ar: 0.080, al: 0.16,
      lx: 0.116, ly: -0.40, lr: 0.082, ll: 0.12,
      ex: 0.116, ey: 0.24, ez: 0.32, er: 0.053 },
    // 2: Red — widest and biggest
    { bsx: 1.30, bsy: 1.10, bsz: 0.96,
      ax: 0.47, ay: 0.09,  ar: 0.090, al: 0.18,
      lx: 0.138, ly: -0.33, lr: 0.092, ll: 0.13,
      ex: 0.134, ey: 0.17, ez: 0.36, er: 0.058 },
    // 3: Green — short and round
    { bsx: 1.22, bsy: 1.08, bsz: 0.93,
      ax: 0.44, ay: 0.08,  ar: 0.082, al: 0.15,
      lx: 0.126, ly: -0.32, lr: 0.084, ll: 0.11,
      ex: 0.124, ey: 0.16, ez: 0.34, er: 0.053 },
    // 4: Purple — tallest and narrowest
    { bsx: 0.86, bsy: 1.58, bsz: 0.83,
      ax: 0.31, ay: 0.17,  ar: 0.066, al: 0.12,
      lx: 0.090, ly: -0.47, lr: 0.070, ll: 0.10,
      ex: 0.094, ey: 0.32, ez: 0.25, er: 0.044 },
    // 5: Gray — medium height, slim
    { bsx: 0.96, bsy: 1.42, bsz: 0.87,
      ax: 0.36, ay: 0.15,  ar: 0.074, al: 0.14,
      lx: 0.100, ly: -0.43, lr: 0.076, ll: 0.11,
      ex: 0.104, ey: 0.28, ez: 0.28, er: 0.048 },
] as const;

// ─── Spring physics ───────────────────────────────────────────────────────────
class Spring {
    pos: number;
    vel = 0;
    target: number;
    k: number;
    b: number;

    constructor(init: number, stiffness = 200, damping = 18) {
        this.pos    = init;
        this.target = init;
        this.k      = stiffness;
        this.b      = damping;
    }

    step(dt: number): number {
        const d  = Math.min(dt, 0.033);
        const f  = (this.target - this.pos) * this.k - this.vel * this.b;
        this.vel += f * d;
        this.pos += this.vel * d;
        return this.pos;
    }
}

// ─── Toon gradient (module singleton) ────────────────────────────────────────
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

// ─── Argonaut ─────────────────────────────────────────────────────────────────
interface ArgonautProps {
    color: string;
    finalX: number;
    idx: number;
}

const ARM_REST   =  0.68;   // rad — arms point outward-down at rest (~39° from vertical)
const ARM_RAISED =  2.72;   // rad — arm raised up (wave)

const Argonaut = React.memo<ArgonautProps>(({ color, finalX, idx }) => {
    const sh = SHAPES[idx];

    const groupRef = useRef<THREE.Group>(null!);
    const bodyRef  = useRef<THREE.Mesh>(null!);
    const lArmRef  = useRef<THREE.Group>(null!);
    const rArmRef  = useRef<THREE.Group>(null!);
    const lLegRef  = useRef<THREE.Group>(null!);
    const rLegRef  = useRef<THREE.Group>(null!);
    const lEyeRef  = useRef<THREE.Mesh>(null!);
    const rEyeRef  = useRef<THREE.Mesh>(null!);

    const toon = useMemo(() => toonMap(), []);

    const per = useMemo(() => ({
        delay:      idx * 0.22,
        walkSpd:    4.8 + idx * 0.18,
        breathSpd:  1.0 + (idx % 3) * 0.22,
        breathAmt:  0.013 + (idx % 2) * 0.009,
        swaySpd:    0.48 + (idx % 4) * 0.14,
        swayAmt:    0.015 + (idx % 3) * 0.007,
        phase:      (idx / N) * Math.PI * 2,
        blinkEvery: 3.6 + idx * 0.55,
    }), [idx]);

    const xSpr    = useRef(new Spring(finalX + ENTRY_X_OFFSET, 52, 10));
    // Arms start at rest angle — stepped every frame so no jump on arrival
    const lArmSpr = useRef(new Spring( ARM_REST, 240, 20));
    const rArmSpr = useRef(new Spring(-ARM_REST, 240, 20));

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
        const t = state.clock.getElapsedTime();
        const s = st.current;

        if (s.startT < 0) {
            s.startT    = t;
            s.lastBlink = t + per.delay + per.blinkEvery * 0.6 + idx * 0.4;
        }

        if (t - s.startT < per.delay) return;

        // ── X entry spring ────────────────────────────────────────────────
        xSpr.current.target = finalX;
        const cx = xSpr.current.step(delta);
        groupRef.current.position.x = cx;

        const dist    = Math.abs(cx - finalX);
        const walking = dist > 0.07;
        if (!walking && !s.arrived) s.arrived = true;

        // ── Arm Z spring — always stepped to avoid jump on arrival ────────
        const wave = s.hovered && s.arrived ? Math.sin(t * 7.8) * 0.17 : 0;
        lArmSpr.current.target = s.hovered && s.arrived && s.raiseLeft  ?  ARM_RAISED + wave :  ARM_REST;
        rArmSpr.current.target = s.hovered && s.arrived && !s.raiseLeft ? -ARM_RAISED - wave : -ARM_REST;
        lArmRef.current.rotation.z = lArmSpr.current.step(delta);
        rArmRef.current.rotation.z = rArmSpr.current.step(delta);

        // ── Walk animation ────────────────────────────────────────────────
        const elapsed = t - s.startT;
        if (walking) {
            const wt = elapsed * per.walkSpd;
            lLegRef.current.rotation.x =  Math.sin(wt)            * 0.48;
            rLegRef.current.rotation.x =  Math.sin(wt + Math.PI)  * 0.48;
            lArmRef.current.rotation.x =  Math.sin(wt + Math.PI)  * 0.20;
            rArmRef.current.rotation.x =  Math.sin(wt)            * 0.20;
            groupRef.current.position.y = Math.abs(Math.sin(wt * 2)) * 0.04 + BASE_Y;
        }

        // ── Idle animations ───────────────────────────────────────────────
        if (s.arrived) {
            lLegRef.current.rotation.x *= 0.84;
            rLegRef.current.rotation.x *= 0.84;
            lArmRef.current.rotation.x *= 0.84;
            rArmRef.current.rotation.x *= 0.84;

            // Breathing — multiply base scale to preserve character proportions
            const bt      = t * per.breathSpd + per.phase;
            const breathV = Math.sin(bt);
            bodyRef.current.scale.y = sh.bsy * (1 + breathV * per.breathAmt * 2);
            bodyRef.current.scale.x = sh.bsx * (1 - breathV * per.breathAmt * 0.5);

            groupRef.current.position.y = BASE_Y + Math.sin(bt * 0.5) * 0.011;
            groupRef.current.rotation.z = Math.sin(t * per.swaySpd + per.phase) * per.swayAmt;

            // Blink
            if (t > s.lastBlink && !s.blinking) {
                s.blinking  = true;
                s.blinkT    = t;
                s.lastBlink = t + per.blinkEvery + (idx % 3) * 0.4;
            }
            if (s.blinking) {
                const bf  = (t - s.blinkT) / 0.13;
                const sc  = bf < 0.5 ? 1 - bf * 2 * 0.92 : 0.08 + (bf - 0.5) * 2 * 0.92;
                const esc = Math.max(0.06, Math.min(1, sc));
                lEyeRef.current.scale.y = esc;
                rEyeRef.current.scale.y = esc;
                if (bf >= 1) {
                    s.blinking = false;
                    lEyeRef.current.scale.y = 1;
                    rEyeRef.current.scale.y = 1;
                }
            }
        }
    });

    const onEnter = () => { st.current.raiseLeft = Math.random() > 0.5; st.current.hovered = true; };
    const onLeave = () => { st.current.hovered = false; };

    // Capsule mesh offset: top of capsule sits at the pivot point
    const armMeshY = -(sh.al / 2 + sh.ar);
    const legMeshY = -(sh.ll / 2 + sh.lr);

    return (
        <group ref={groupRef} position={[finalX + ENTRY_X_OFFSET, BASE_Y, 0]}>
            <group onPointerEnter={onEnter} onPointerLeave={onLeave}>

                {/* Body */}
                <mesh ref={bodyRef} scale={[sh.bsx, sh.bsy, sh.bsz]}>
                    <sphereGeometry args={[BODY_R, 28, 28]} />
                    <meshToonMaterial color={color} gradientMap={toon} />
                </mesh>

                {/* Eyes */}
                <mesh ref={lEyeRef} position={[-sh.ex, sh.ey, sh.ez]}>
                    <sphereGeometry args={[sh.er, 10, 10]} />
                    <meshToonMaterial color={EYE_COLOR} gradientMap={toon} />
                </mesh>
                <mesh ref={rEyeRef} position={[sh.ex, sh.ey, sh.ez]}>
                    <sphereGeometry args={[sh.er, 10, 10]} />
                    <meshToonMaterial color={EYE_COLOR} gradientMap={toon} />
                </mesh>

                {/* Left arm — pivot at shoulder */}
                <group ref={lArmRef} position={[-sh.ax, sh.ay, 0]}>
                    <mesh position={[0, armMeshY, 0]}>
                        <capsuleGeometry args={[sh.ar, sh.al, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

                {/* Right arm */}
                <group ref={rArmRef} position={[sh.ax, sh.ay, 0]}>
                    <mesh position={[0, armMeshY, 0]}>
                        <capsuleGeometry args={[sh.ar, sh.al, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

                {/* Left leg — pivot at hip */}
                <group ref={lLegRef} position={[-sh.lx, sh.ly, 0]}>
                    <mesh position={[0, legMeshY, 0]}>
                        <capsuleGeometry args={[sh.lr, sh.ll, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

                {/* Right leg */}
                <group ref={rLegRef} position={[sh.lx, sh.ly, 0]}>
                    <mesh position={[0, legMeshY, 0]}>
                        <capsuleGeometry args={[sh.lr, sh.ll, 4, 10]} />
                        <meshToonMaterial color={color} gradientMap={toon} />
                    </mesh>
                </group>

            </group>
        </group>
    );
});

Argonaut.displayName = 'Argonaut';

// ─── Scene ────────────────────────────────────────────────────────────────────
const Scene: React.FC = () => (
    <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 6, 5]} intensity={0.7} />
        {COLORS.map((color, i) => (
            <Argonaut key={color} color={color} finalX={FINAL_X[i]} idx={i} />
        ))}
    </>
);

// ─── Canvas ───────────────────────────────────────────────────────────────────
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
