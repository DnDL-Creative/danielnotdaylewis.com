"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, useTexture, Plane } from "@react-three/drei";
import * as THREE from "three";

const BACKDROPS = {
  teal: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_x2w1c9x2w1c9x2w1.jpeg",
  yellow:
    "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_okrpz7okrpz7okrp.jpeg",
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
      // INCREASED MULTIPLIER TO 7.5 TO OVERSIZE IMAGE
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

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
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
      attr[i * 3 + 1] -= velocities[i];
      attr[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;

      if (attr[i * 3 + 1] < -15) {
        attr[i * 3 + 1] = 15;
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
