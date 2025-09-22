import React from 'react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import titleImage from 'figma:asset/221fc3a21f04fedae14cf7d4328f0bc770fd5fda.png';
import fullDesign from 'figma:asset/6d68b749d9ec39f640f64bd2cfe841ec617bda44.png';
import earthImage from 'figma:asset/582e096c79f17a74f836c71e8ca817da0cfe8d37.png';
import researchCard from 'figma:asset/2ad5b84612e8f9a6e7c47f16363d745ab409b653.png';
import mindmapCard from 'figma:asset/5e6611885b53e41830d3f8077a65054b1429d53f.png';
import workflowCard from 'figma:asset/b703f2bc0b3cbc5895817d9f9774e0752341741f.png';
import headerImage from 'figma:asset/c4f939db396f9eac828d212c623d69a432bcfb16.png';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  // Load ABC Favorite Mono font
  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=ABC+Favorit+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#f8f4ec' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Header image */}
      <motion.div 
        className="absolute top-4 w-full flex justify-center px-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <img 
          src={headerImage} 
          alt="by enrico & na - dei summer lab '25" 
          className="h-12 md:h-16 lg:h-20 xl:h-24 object-contain max-w-full"
        />
      </motion.div>

      {/* Main content container */}
      <div className="flex flex-col items-center justify-start pt-24 px-6 h-screen overflow-hidden">
        {/* Sub-heading - moved down much more */}
        <motion.div 
          className="text-center mb-0 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p 
            className="text-lg md:text-xl tracking-wider"
            style={{ 
              fontFamily: '"ABC Favorit Mono", "Courier New", monospace',
              color: '#797979'
            }}
          >
            HI! I'M YOUR PERSONAL
          </p>
        </motion.div>

        {/* Main title without asterisks - slightly smaller size */}
        <motion.div 
          className="flex items-center justify-center mb-0 mt-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.6 }}
        >
<img 
  src={titleImage} 
  alt="ADVERSARIAL COLLABORATOR" 
  className="h-36 md:h-48 lg:h-60 xl:h-72 object-contain pixelated-title max-w-full"
  style={{
    imageRendering: 'pixelated',
    MozImageRendering: 'crisp-edges',
    WebkitImageRendering: 'crisp-edges',
    marginBottom: 0,
    display: 'block'
  }}
/>

        </motion.div>

        {/* Get Started Button - directly touching title */}
        <motion.div 
          className="mb-4 -mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button 
            onClick={onGetStarted}
            className="bg-black text-white hover:bg-gray-800 text-xl px-12 py-4 rounded-full transition-colors duration-300"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Get Started
          </Button>
        </motion.div>

        {/* Feature cards */}
        <motion.div 
          className="grid md:grid-cols-3 gap-2 max-w-4xl mx-auto mb-2"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          {/* Research Collaboration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: [0, -8, 0] 
            }}
            transition={{ 
              opacity: { duration: 0.6, delay: 1.2 },
              y: { 
                duration: 3.5, 
                delay: 1.2,
                repeat: Infinity, 
                ease: "easeInOut" 
              }
            }}
          >
            <img 
              src={researchCard} 
              alt="Research Collaboration" 
              className="w-full h-auto object-contain"
            />
          </motion.div>

          {/* Visual Mind Mapping Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: [0, -12, 0] 
            }}
            transition={{ 
              opacity: { duration: 0.6, delay: 1.4 },
              y: { 
                duration: 4.2, 
                delay: 1.8,
                repeat: Infinity, 
                ease: "easeInOut" 
              }
            }}
          >
            <img 
              src={mindmapCard} 
              alt="Visual Mind Mapping" 
              className="w-full h-auto object-contain"
            />
          </motion.div>

          {/* Integrated Workflow Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: [0, -6, 0] 
            }}
            transition={{ 
              opacity: { duration: 0.6, delay: 1.6 },
              y: { 
                duration: 2.8, 
                delay: 2.1,
                repeat: Infinity, 
                ease: "easeInOut" 
              }
            }}
          >
            <img 
              src={workflowCard} 
              alt="Integrated Workflow" 
              className="w-full h-auto object-contain"
            />
          </motion.div>
        </motion.div>

      </div>

      {/* Earth/Globe positioned to overlap cards */}
      <motion.div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[35%]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, delay: 1.8 }}
      >
        <img 
          src={earthImage} 
          alt="Earth" 
          className="w-[32rem] h-[32rem] md:w-[36rem] md:h-[36rem] lg:w-[40rem] lg:h-[40rem] xl:w-[44rem] xl:h-[44rem] object-contain"
          style={{
            imageRendering: 'auto'
          }}
        />
      </motion.div>
    </motion.div>
  );
}