import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
// Original cloud varieties
import cloud1 from 'figma:asset/932cd32251e76f659cb00b42c0e50c80576a7bda.png';
import cloud2 from 'figma:asset/8deb1d77adab541e97a5456e64d5f90f22d62448.png';
import cloud3 from 'figma:asset/947e9c824ae13b6fda9a7520591de7bf540d7c3d.png';
// New cloud varieties for more diversity
import cloud4 from 'figma:asset/97834ab65ff34eeb3354715a3ded5e742ac4aaa1.png';
import cloud5 from 'figma:asset/f70c7888fc745d1e528b1cbe0ad44db74370ea1c.png';
import cloud6 from 'figma:asset/07f0e2ce4de0f2be4e869ef1ae18df496dc3fa8c.png';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDelay: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  cloudType: number; // 0-5 for six different cloud assets
  delay: number; // Animation delay for staggered start
}



export function DitheredBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);


  // Blue color palette from the reference
  const colorPalette = [
    [10, 14, 46],    // #0a0e2e - Very dark navy
    [26, 36, 101],   // #1a2465 - Dark blue
    [45, 75, 184],   // #2d4bb8 - Medium blue
    [65, 105, 225],  // #4169e1 - Royal blue
    [91, 141, 245],  // #5b8df5 - Lighter blue
    [123, 179, 255], // #7bb3ff - Sky blue
    [157, 206, 255], // #9dceff - Light sky blue
    [196, 228, 255], // #c4e4ff - Very light blue
    [232, 244, 255], // #e8f4ff - Pale blue
    [245, 250, 255]  // #f5faff - Almost white
  ];

  // Standard 4x4 Bayer dithering matrix
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      ctx.scale(dpr, dpr);
      drawDitheredGradient();
    };

    const drawDitheredGradient = () => {
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Simple approach following your code example
      for (let sy = 0; sy < height; sy++) {
        // Get original gradient color for this row (simplified)
        const origColor = (sy / height) * 255; // Simple 0-255 gradient
        
        for (let sx = 0; sx < width; sx++) {
          const index = (sy * width + sx) * 4;
          
          // Get Bayer matrix value
          const bayerX = sx % 4;
          const bayerY = sy % 4;
          const bayerValue = bayerMatrix[bayerY][bayerX] / 15.0; // Normalize to 0-1
          
          // Apply dithering exactly like your code example
          const bayerStrength = 32; // Controls dithering intensity (matches bayer range)
          const outputColor = origColor + (bayerStrength * bayerValue);
          
          // Find which palette colors to use based on output
          const palettePos = (outputColor / 255) * (colorPalette.length - 1);
          const paletteIndex = Math.floor(palettePos);
          const clampedIndex = Math.max(0, Math.min(colorPalette.length - 1, paletteIndex));
          
          // Simple threshold comparison (like output_color < (NUM_VALUES / 2))
          const numValues = 255;
          let colorResult;
          
          if (outputColor < (numValues / 2)) {
            // Use darker palette color
            const darkIndex = Math.max(0, clampedIndex - 1);
            colorResult = colorPalette[darkIndex];
          } else {
            // Use lighter palette color  
            const lightIndex = Math.min(colorPalette.length - 1, clampedIndex + 1);
            colorResult = colorPalette[lightIndex];
          }
          
          // Set pixel color directly
          data[index] = colorResult[0];     // R
          data[index + 1] = colorResult[1]; // G
          data[index + 2] = colorResult[2]; // B
          data[index + 3] = 255;            // A
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    const handleResize = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      resizeCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    // Generate random stars
    const newStars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.3,
        twinkleDelay: Math.random() * 3
      });
    }
    setStars(newStars);

    // Generate ONLY 3 clouds in completely fixed positions - NO ALGORITHMS
    const newClouds: Cloud[] = [];
    
    // HARDCODED positions that are guaranteed to be visible and well-spaced
    const fixedClouds = [
      {
        id: 0,
        x: 20,   // Left side (but visible)
        y: 25,   // Upper area
        size: 220, // Big cloud
        speed: 220,
        opacity: 0.8,
        cloudType: 0,
        delay: 0
      },
      {
        id: 1,
        x: 75,   // Right side (but visible)
        y: 65,   // Lower area
        size: 250, // Bigger cloud
        speed: 250,
        opacity: 0.7,
        cloudType: 2,
        delay: 8
      },
      {
        id: 2,
        x: 50,   // Center horizontally
        y: 15,   // Very top
        size: 180, // Medium cloud
        speed: 200,
        opacity: 0.75,
        cloudType: 4,
        delay: 15
      }
    ];
    
    // Add the 3 fixed clouds - no randomness, no algorithms
    fixedClouds.forEach(cloudData => {
      newClouds.push({
        id: cloudData.id,
        x: cloudData.x,
        y: cloudData.y,
        size: cloudData.size,
        speed: cloudData.speed,
        opacity: cloudData.opacity,
        cloudType: cloudData.cloudType,
        delay: cloudData.delay
      });
    });
    
    setClouds(newClouds);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dithered gradient canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 dithered-noise opacity-20" />
      
      {/* Stars with pixelated rendering */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white pixel-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            imageRendering: 'pixelated'
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.4, star.opacity],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: star.twinkleDelay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Pixelated floating clouds - right to left with 6 varieties */}
      {clouds.map((cloud) => {
        // Select cloud asset based on cloudType (now 6 varieties)
        const cloudAssets = [cloud1, cloud2, cloud3, cloud4, cloud5, cloud6];
        const cloudSrc = cloudAssets[cloud.cloudType];
        
        return (
          <motion.img
            key={cloud.id}
            src={cloudSrc}
            alt=""
            className="absolute pixelated-cloud"
            style={{
              top: `${cloud.y}%`,
              width: `${cloud.size}px`,
              height: 'auto',
              opacity: cloud.opacity,
              imageRendering: 'pixelated',
              filter: 'contrast(1.05) brightness(1.05) saturate(1.1)', // Balanced filter for good visibility
              zIndex: 10 + Math.floor(cloud.y / 25) // Balanced layering for multiple clouds
            }}
            initial={{ 
              x: `${cloud.x}%`, // Start at calculated position
              y: 0,
              scale: 1
            }}
            animate={{ 
              x: [`${cloud.x}%`, `${cloud.x - 150}%`], // Slow movement for big clouds
              y: [0, -4, 0, 3, 0, -2, 0], // Gentle, majestic floating motion
              scale: [0.98, 1.03, 0.99, 1.01, 0.97, 1.02, 0.98] // Subtle breathing effect
            }}
            transition={{
              x: {
                duration: cloud.speed,
                repeat: Infinity,
                ease: "linear",
                delay: cloud.delay,
                repeatType: "loop"
              },
              y: {
                duration: cloud.speed * 0.4, // Balanced vertical motion
                repeat: Infinity,
                ease: "easeInOut",
                delay: cloud.delay
              },
              scale: {
                duration: cloud.speed * 0.5, // Balanced breathing effect
                repeat: Infinity,
                ease: "easeInOut",
                delay: cloud.delay
              }
            }}
          />
        );
      })}

      {/* Enhanced floating dithered pixels */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`dither-pixel-${i}`}
          className="absolute w-1 h-1 bg-white/70 dithered-pixel"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            imageRendering: 'pixelated'
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.4, 0.9, 0.4],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Sparkle overlay with dithered effect */}
      <div className="absolute inset-0 dithered-sparkles" />
    </div>
  );
}