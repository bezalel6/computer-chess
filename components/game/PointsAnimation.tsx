/**
 * Points Animation Component
 *
 * Shows floating points animation when challenges are completed.
 */

'use client';

import { useEffect, useState } from 'react';

interface FloatingPoint {
  id: string;
  points: number;
  x: number;
  y: number;
}

interface PointsAnimationProps {
  points: number;
  trigger: boolean;
}

export function PointsAnimation({ points, trigger }: PointsAnimationProps) {
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);

  useEffect(() => {
    if (trigger && points > 0) {
      const id = `${Date.now()}-${Math.random()}`;
      const x = Math.random() * 200 - 100; // Random x offset
      const newPoint: FloatingPoint = {
        id,
        points,
        x,
        y: 0,
      };

      setFloatingPoints((prev) => [...prev, newPoint]);

      // Remove after animation
      setTimeout(() => {
        setFloatingPoints((prev) => prev.filter((p) => p.id !== id));
      }, 2000);
    }
  }, [trigger, points]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {floatingPoints.map((point) => (
        <div
          key={point.id}
          className="absolute top-1/2 left-1/2 animate-float-up"
          style={{
            transform: `translate(${point.x}px, 0)`,
            animation: 'floatUp 2s ease-out forwards',
          }}
        >
          <div className="text-4xl font-bold text-green-500 drop-shadow-lg">
            +{point.points}
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(${floatingPoints[0]?.x || 0}px, 0) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(${floatingPoints[0]?.x || 0}px, -100px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(${floatingPoints[0]?.x || 0}px, -200px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}