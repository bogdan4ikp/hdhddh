import React from 'react';
import { motion } from 'motion/react';

export default function DJBooth() {
  return (
    <motion.div
      animate={{ x: ['-20vw', '100vw'] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      className="absolute bottom-10 left-0 flex flex-col items-center z-20 pointer-events-none"
    >
      {/* Floating Notes */}
      <motion.div 
        animate={{ y: [-20, -80], x: [0, 40], opacity: [1, 0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
        className="absolute -top-16 right-10 text-white text-5xl font-serif drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      >
        ♪
      </motion.div>
      <motion.div 
        animate={{ y: [-10, -70], x: [0, -30], opacity: [1, 0, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1, ease: "easeOut" }}
        className="absolute -top-10 left-10 text-neutral-300 text-4xl font-serif drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
      >
        ♫
      </motion.div>
      <motion.div 
        animate={{ y: [-30, -90], x: [0, 20], opacity: [1, 0, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: 1.5, ease: "easeOut" }}
        className="absolute -top-20 left-1/2 text-neutral-400 text-3xl font-serif drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
      >
        ♬
      </motion.div>

      {/* DJ Character */}
      <div className="relative z-10 flex flex-col items-center -mb-6">
        <motion.div 
          animate={{ rotate: [-15, 15, -15], y: [0, 5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-white rounded-full border-4 border-[#121212] flex items-center justify-center relative shadow-lg"
        >
          {/* Headphones */}
          <div className="absolute -inset-3 border-t-8 border-x-8 border-neutral-300 rounded-t-full"></div>
          <div className="absolute -left-4 top-5 w-6 h-10 bg-neutral-300 rounded-full shadow-md"></div>
          <div className="absolute -right-4 top-5 w-6 h-10 bg-neutral-300 rounded-full shadow-md"></div>
          
          {/* Sunglasses */}
          <div className="flex gap-1.5 mt-2">
            <div className="w-6 h-4 bg-[#121212] rounded-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 transform -skew-x-12"></div>
            </div>
            <div className="w-6 h-4 bg-[#121212] rounded-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 transform -skew-x-12"></div>
            </div>
          </div>
        </motion.div>
        <div className="w-24 h-20 bg-neutral-200 rounded-t-3xl mt-1 relative overflow-hidden">
          <div className="absolute inset-x-0 top-4 h-2 bg-white/50"></div>
        </div>
        
        {/* Arms scratching */}
        <motion.div 
          animate={{ rotate: [-30, 10, -30] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 -left-6 w-16 h-5 bg-white rounded-full origin-right"
        ></motion.div>
        <motion.div 
          animate={{ rotate: [30, -10, 30] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 -right-6 w-16 h-5 bg-white rounded-full origin-left"
        ></motion.div>
      </div>

      {/* Desk / Booth */}
      <div className="relative z-20 w-[340px] h-32 bg-[#181818] rounded-t-2xl border-t-4 border-x-4 border-neutral-800 flex items-center justify-between px-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {/* Left Speaker */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
          className="w-20 h-20 bg-[#121212] rounded-xl border-4 border-neutral-800 flex flex-col items-center justify-center gap-2 shadow-inner"
        >
          <div className="w-4 h-4 bg-[#181818] rounded-full"></div>
          <div className="w-10 h-10 bg-[#181818] rounded-full border-2 border-black"></div>
        </motion.div>
        
        {/* Turntables */}
        <div className="flex gap-3 bg-[#121212] p-3 rounded-xl border-2 border-neutral-800 shadow-inner">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 bg-black rounded-full border-2 border-neutral-700 flex items-center justify-center relative"
          >
            <div className="absolute inset-1 border border-[#181818] rounded-full"></div>
            <div className="absolute inset-2 border border-[#181818] rounded-full"></div>
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </motion.div>
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 bg-black rounded-full border-2 border-neutral-700 flex items-center justify-center relative"
          >
            <div className="absolute inset-1 border border-[#181818] rounded-full"></div>
            <div className="absolute inset-2 border border-[#181818] rounded-full"></div>
            <div className="w-4 h-4 bg-neutral-300 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </motion.div>
        </div>

        {/* Right Speaker */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: 0.2, ease: "easeOut" }}
          className="w-20 h-20 bg-[#121212] rounded-xl border-4 border-neutral-800 flex flex-col items-center justify-center gap-2 shadow-inner"
        >
          <div className="w-4 h-4 bg-[#181818] rounded-full"></div>
          <div className="w-10 h-10 bg-[#181818] rounded-full border-2 border-black"></div>
        </motion.div>

        {/* Equalizer LED bars */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, Math.random() * 16 + 4, 4] }}
              transition={{ duration: 0.2 + Math.random() * 0.3, repeat: Infinity }}
              className={`w-2 rounded-t-sm ${i < 4 ? 'bg-white' : i < 8 ? 'bg-neutral-300' : 'bg-neutral-500'}`}
            />
          ))}
        </div>
      </div>

      {/* Base / Chassis */}
      <div className="w-[380px] h-8 bg-[#121212] rounded-full relative z-10 border-b-4 border-black">
        {/* Wheels */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-8 left-10 w-16 h-16 bg-[#181818] rounded-full border-4 border-black flex items-center justify-center shadow-lg"
        >
          <div className="w-8 h-8 border-4 border-neutral-700 rounded-full flex items-center justify-center border-dashed">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </motion.div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-8 right-10 w-16 h-16 bg-[#181818] rounded-full border-4 border-black flex items-center justify-center shadow-lg"
        >
          <div className="w-8 h-8 border-4 border-neutral-700 rounded-full flex items-center justify-center border-dashed">
            <div className="w-3 h-3 bg-neutral-300 rounded-full"></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
