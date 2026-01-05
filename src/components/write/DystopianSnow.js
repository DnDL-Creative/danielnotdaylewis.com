"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, useTexture, Plane } from "@react-three/drei";
import * as THREE from "three";

const BACKDROPS = {
  teal: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_x2w1c9x2w1c9x2w1.jpeg",
  yellow:
    "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/vibewriter-skyline-newcincinnati-cyberpunk.jpeg",
};

const SNOW_COLORS = {
  teal: "#2dd4bf",
  yellow: "#facc15", // Yellow-400
};

function HallOfHumanWriting({ theme }) {
  const { viewport } = useThree();
  const texture = useTexture(BACKDROPS[theme] || BACKDROPS.teal);

  return (
    <Plane
      position={[0, 0, -40]}
      args={[viewport.width * 7.5, viewport.height * 7.5]}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.8}
        toneMapped={false}
      />
    </Plane>
  );
}

export default function DystopianSnow({ theme = "teal" }) {
  const ref = useRef();
  const count = 30000;

  // Define the boundary width (matches the random distribution below)
  const xBound = 25;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Range: -25 to +25 on X
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;

      vel[i] = 0.01 + Math.random() * 0.03;
    }
    return [pos, vel];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      // 1. Move Down (Y-Axis)
      attr[i * 3 + 1] -= velocities[i];

      // 2. Move Sideways (X-Axis) - THE ANGLE
      // We add a portion of the velocity to X to create a diagonal slope.
      // 0.3 creates a gentle breeze to the right. Change to negative for left.
      attr[i * 3] += velocities[i] * 0.3;

      // 3. Add Wobble (Sine wave)
      attr[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;

      // 4. Reset Height (Y wrap)
      if (attr[i * 3 + 1] < -15) {
        attr[i * 3 + 1] = 15;
      }

      // 5. Reset Width (X wrap)
      // Since we drift right, we check if it goes past the right boundary
      // and snap it back to the left boundary.
      if (attr[i * 3] > xBound) {
        attr[i * 3] = -xBound;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <React.Suspense fallback={null}>
        <HallOfHumanWriting theme={theme} />
      </React.Suspense>

      <ambientLight intensity={0.2} />
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={SNOW_COLORS[theme] || SNOW_COLORS.teal}
          size={0.025}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
        />
      </Points>
    </>
  );
}
