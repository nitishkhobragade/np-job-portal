"use client";

import React from 'react';

export type CharacterType = 'male' | 'female' | 'custom' | 'none';

interface CandidateCharacterProps {
  type: CharacterType;
  customUrl?: string;
  className?: string;
}

export const CandidateCharacter: React.FC<CandidateCharacterProps> = ({
  type,
  customUrl,
  className = ''
}) => {
  if (type === 'none') return null;

  if (type === 'custom' && customUrl) {
    return (
      <div className={`relative flex items-end justify-center h-full select-none pointer-events-none ${className}`}>
        {/* Soft shadow under cut-out */}
        <div className="absolute -bottom-2 w-3/4 h-8 bg-black/30 rounded-full blur-md" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customUrl}
          alt="Candidate Graphic"
          className="relative max-h-full max-w-full object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]"
        />
      </div>
    );
  }

  if (type === 'female') {
    // Professional Indian Female Executive / Officer with blazer, tablet & blueprint
    return (
      <div className={`relative flex items-end justify-center h-full select-none pointer-events-none ${className}`}>
        {/* Ground drop shadow */}
        <div className="absolute -bottom-2 w-4/5 h-8 bg-black/25 rounded-full blur-md" />

        <svg
          viewBox="0 0 400 600"
          className="relative w-full h-full max-h-[580px] drop-shadow-[0_16px_28px_rgba(0,0,0,0.3)] overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="fem-skin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffdbb4" />
              <stop offset="100%" stopColor="#e5a676" />
            </linearGradient>
            <linearGradient id="fem-suit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="fem-scarf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="fem-hair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="100%" stopColor="#0c0a09" />
            </linearGradient>
            <linearGradient id="fem-tablet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="fem-paper" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Torso / Blazer Body */}
          <path
            d="M90 600 L110 320 L150 280 L200 350 L250 280 L290 320 L310 600 Z"
            fill="url(#fem-suit)"
          />

          {/* White Shirt Collar & V-Neck */}
          <path d="M150 280 L200 365 L250 280 L200 310 Z" fill="#ffffff" />

          {/* Silk Scarf / Neck Tie */}
          <path
            d="M175 285 Q200 330 185 410 Q195 415 205 410 Q195 330 225 285 Z"
            fill="url(#fem-scarf)"
          />
          {/* Stripes on Scarf */}
          <path d="M178 320 L218 318" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M182 350 L212 348" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M185 380 L205 378" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

          {/* Blazer Lapels */}
          <path d="M140 285 L180 430 L200 370 L155 285 Z" fill="#0f172a" />
          <path d="M260 285 L220 430 L200 370 L245 285 Z" fill="#1e293b" />
          <circle cx="200" cy="460" r="5" fill="#475569" />
          <circle cx="200" cy="505" r="5" fill="#475569" />

          {/* Neck */}
          <path d="M175 220 L175 295 Q200 305 225 295 L225 220 Z" fill="url(#fem-skin)" />
          {/* Neck shadow */}
          <path d="M175 220 Q200 245 225 220 L225 235 Q200 260 175 235 Z" fill="#c28556" opacity="0.4" />

          {/* Head & Face */}
          <ellipse cx="200" cy="180" rx="55" ry="68" fill="url(#fem-skin)" />

          {/* Ears */}
          <ellipse cx="145" cy="182" rx="9" ry="16" fill="url(#fem-skin)" />
          <circle cx="145" cy="192" r="3.5" fill="#eab308" />
          <ellipse cx="255" cy="182" rx="9" ry="16" fill="url(#fem-skin)" />
          <circle cx="255" cy="192" r="3.5" fill="#eab308" />

          {/* Hair - Sleek Professional Bun/Back */}
          <path
            d="M135 185 Q135 95 200 95 Q265 95 265 185 Q265 130 200 130 Q135 130 135 185 Z"
            fill="url(#fem-hair)"
          />
          <path
            d="M145 150 Q175 110 200 130 Q225 110 255 150 Q265 190 260 240 Q250 180 230 160 Q200 145 170 160 Q150 180 140 240 Q135 190 145 150 Z"
            fill="url(#fem-hair)"
          />
          {/* Top bun */}
          <ellipse cx="200" cy="92" rx="35" ry="24" fill="url(#fem-hair)" />

          {/* Eyebrows */}
          <path d="M165 158 Q178 152 188 157" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
          <path d="M212 157 Q222 152 235 158" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />

          {/* Eyes */}
          <ellipse cx="177" cy="172" rx="7.5" ry="5.5" fill="#ffffff" />
          <circle cx="178" cy="172" r="4.5" fill="#292524" />
          <circle cx="179.5" cy="170.5" r="1.5" fill="#ffffff" />

          <ellipse cx="223" cy="172" rx="7.5" ry="5.5" fill="#ffffff" />
          <circle cx="222" cy="172" r="4.5" fill="#292524" />
          <circle cx="223.5" cy="170.5" r="1.5" fill="#ffffff" />

          {/* Bindi */}
          <circle cx="200" cy="160" r="2.5" fill="#991b1b" />

          {/* Nose */}
          <path d="M198 170 L203 192 Q198 196 195 195" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />

          {/* Smile / Lips */}
          <path d="M185 212 Q200 225 215 212" stroke="#be123c" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M188 213 Q200 220 212 213" fill="#ffffff" />

          {/* ID Badge on Blazer */}
          <rect x="145" y="340" width="38" height="52" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="150" y="345" width="28" height="24" rx="2" fill="#0284c7" />
          <rect x="150" y="374" width="28" height="3" rx="1" fill="#475569" />
          <rect x="150" y="380" width="18" height="3" rx="1" fill="#94a3b8" />
          <path d="M164 340 L164 330" stroke="#cbd5e1" strokeWidth="2" />

          {/* Right Arm Holding Rolled Blueprint/Paper */}
          <path d="M290 320 Q335 400 320 520 L275 500 Q285 410 260 340 Z" fill="#0f172a" />
          {/* Rolled Blueprint cylinder */}
          <g transform="rotate(-15 320 480)">
            <rect x="305" y="360" width="35" height="210" rx="12" fill="url(#fem-paper)" stroke="#cbd5e1" strokeWidth="2" />
            <ellipse cx="322" cy="365" rx="17" ry="8" fill="#e2e8f0" stroke="#94a3b8" />
            <path d="M305 430 L340 430" stroke="#0284c7" strokeWidth="3" opacity="0.6" />
            <path d="M305 490 L340 490" stroke="#0284c7" strokeWidth="3" opacity="0.6" />
          </g>
          {/* Hand holding blueprint */}
          <ellipse cx="308" cy="460" rx="16" ry="12" fill="url(#fem-skin)" />

          {/* Left Arm & Hands Holding Modern Digital Tablet */}
          <path d="M110 320 Q70 420 115 500 L145 470 Q115 415 140 330 Z" fill="#0f172a" />

          {/* Digital Tablet */}
          <g transform="rotate(8 160 480)">
            <rect x="90" y="390" width="145" height="195" rx="12" fill="url(#fem-tablet)" stroke="#64748b" strokeWidth="3" />
            {/* Tablet Screen */}
            <rect x="98" y="402" width="129" height="171" rx="6" fill="#f8fafc" />
            {/* Blueprint drawing on screen */}
            <circle cx="162" cy="470" r="28" stroke="#0284c7" strokeWidth="3" strokeDasharray="4 2" fill="#e0f2fe" opacity="0.6" />
            <rect x="142" y="450" width="40" height="40" stroke="#0369a1" strokeWidth="2" fill="none" />
            <path d="M115 515 L210 515" stroke="#94a3b8" strokeWidth="2" />
            <path d="M115 525 L180 525" stroke="#94a3b8" strokeWidth="2" />
            <path d="M115 535 L195 535" stroke="#94a3b8" strokeWidth="2" />
            <rect x="145" y="546" width="35" height="14" rx="4" fill="#059669" />
          </g>

          {/* Left Hand Holding Tablet */}
          <ellipse cx="94" cy="485" rx="14" ry="18" fill="url(#fem-skin)" />
          {/* Right Hand Fingers on other side of tablet */}
          <ellipse cx="232" cy="495" rx="14" ry="18" fill="url(#fem-skin)" />
        </svg>
      </div>
    );
  }

  // Option A: Smart Male Aspirant Student with backpack & ID badge
  return (
    <div className={`relative flex items-end justify-center h-full select-none pointer-events-none ${className}`}>
      {/* Ground drop shadow */}
      <div className="absolute -bottom-2 w-4/5 h-8 bg-black/25 rounded-full blur-md" />

      <svg
        viewBox="0 0 400 600"
        className="relative w-full h-full max-h-[580px] drop-shadow-[0_16px_28px_rgba(0,0,0,0.3)] overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="male-skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#e29b68" />
          </linearGradient>
          <linearGradient id="male-shirt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#172554" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="male-backpack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="male-hair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#292524" />
            <stop offset="100%" stopColor="#0c0a09" />
          </linearGradient>
          <linearGradient id="male-badge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>

        {/* Backpack Straps & Shoulders Background */}
        <path d="M70 340 Q60 450 75 600 L110 600 Q95 450 110 330 Z" fill="url(#male-backpack)" />
        <path d="M330 340 Q340 450 325 600 L290 600 Q305 450 290 330 Z" fill="url(#male-backpack)" />

        {/* Torso / Navy Collared Shirt */}
        <path
          d="M80 600 L105 320 L155 275 L200 325 L245 275 L295 320 L320 600 Z"
          fill="url(#male-shirt)"
        />

        {/* Shirt Placket & Buttons */}
        <rect x="194" y="325" width="12" height="275" fill="#0f172a" />
        <circle cx="200" cy="355" r="3.5" fill="#94a3b8" />
        <circle cx="200" cy="395" r="3.5" fill="#94a3b8" />
        <circle cx="200" cy="440" r="3.5" fill="#94a3b8" />
        <circle cx="200" cy="485" r="3.5" fill="#94a3b8" />

        {/* Shirt Collar */}
        <path d="M155 275 L200 330 L180 345 L145 295 Z" fill="#2563eb" />
        <path d="M245 275 L200 330 L220 345 L255 295 Z" fill="#1d4ed8" />

        {/* Backpack Harness Straps on Chest */}
        <path d="M115 320 Q125 420 135 560" stroke="#475569" strokeWidth="26" strokeLinecap="round" />
        <path d="M285 320 Q275 420 265 560" stroke="#475569" strokeWidth="26" strokeLinecap="round" />
        {/* Buckles */}
        <rect x="122" y="430" width="22" height="14" rx="3" fill="#94a3b8" />
        <rect x="256" y="430" width="22" height="14" rx="3" fill="#94a3b8" />

        {/* Neck */}
        <path d="M175 220 L175 305 Q200 315 225 305 L225 220 Z" fill="url(#male-skin)" />
        <path d="M175 220 Q200 245 225 220 L225 235 Q200 260 175 235 Z" fill="#b45309" opacity="0.3" />

        {/* Lanyard Ribbon */}
        <path d="M185 300 L195 440 L205 440 L215 300" stroke="#0284c7" strokeWidth="8" fill="none" />
        <circle cx="200" cy="442" r="5" fill="#94a3b8" />

        {/* ID Badge Card ("GRADUATE ENGINEER / CANDIDATE") */}
        <g transform="translate(165, 445)">
          <rect x="0" y="0" width="70" height="96" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <rect x="0" y="0" width="70" height="24" rx="6" fill="url(#male-badge)" />
          <text x="35" y="15" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
            GRADUATE
          </text>
          <text x="35" y="22" textAnchor="middle" fill="#e0f2fe" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">
            ENGINEER
          </text>
          {/* Small Candidate Photo */}
          <rect x="22" y="30" width="26" height="28" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
          <circle cx="35" cy="40" r="7" fill="#64748b" />
          <ellipse cx="35" cy="54" rx="11" ry="6" fill="#64748b" />
          {/* Barcode Lines */}
          <rect x="12" y="65" width="46" height="3" rx="1" fill="#1e293b" />
          <rect x="12" y="72" width="30" height="3" rx="1" fill="#64748b" />
          <text x="35" y="88" textAnchor="middle" fill="#0284c7" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
            RRB / SSC 2026
          </text>
        </g>

        {/* Head & Face */}
        <ellipse cx="200" cy="175" rx="58" ry="72" fill="url(#male-skin)" />

        {/* Ears */}
        <ellipse cx="140" cy="175" rx="10" ry="17" fill="url(#male-skin)" />
        <ellipse cx="260" cy="175" rx="10" ry="17" fill="url(#male-skin)" />

        {/* Hair - Smart modern fade/quiff */}
        <path
          d="M136 170 Q135 90 200 85 Q265 90 264 170 Q255 125 200 120 Q145 125 136 170 Z"
          fill="url(#male-hair)"
        />
        <path
          d="M142 145 Q165 95 205 105 Q245 95 258 145 Q265 175 255 185 Q255 140 230 130 Q200 120 170 130 Q145 140 142 185 Z"
          fill="url(#male-hair)"
        />

        {/* Eyebrows */}
        <path d="M162 152 Q177 146 190 152" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
        <path d="M210 152 Q223 146 238 152" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="176" cy="168" rx="8" ry="6" fill="#ffffff" />
        <circle cx="177" cy="168" r="5" fill="#292524" />
        <circle cx="179" cy="166" r="1.5" fill="#ffffff" />

        <ellipse cx="224" cy="168" rx="8" ry="6" fill="#ffffff" />
        <circle cx="223" cy="168" r="5" fill="#292524" />
        <circle cx="225" cy="166" r="1.5" fill="#ffffff" />

        {/* Nose */}
        <path d="M200 166 L204 190 Q199 194 195 193" stroke="#b45309" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.6" />

        {/* Big Confident Smile / Teeth */}
        <path d="M182 208 Q200 226 218 208" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" fill="#b91c1c" />
        <path d="M185 209 Q200 218 215 209 Z" fill="#ffffff" />
      </svg>
    </div>
  );
};
