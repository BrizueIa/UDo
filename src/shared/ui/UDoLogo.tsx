import React, { useId } from 'react';

export interface UDoLogoProps {
  variant?: 'color' | 'mono' | 'horizontal';
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export const UDoLogo: React.FC<UDoLogoProps> = ({
  variant = 'color',
  size = 24,
  className = '',
  showBackground = false,
}) => {
  const id = useId();

  if (variant === 'mono') {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="UDo Logo">
        <path d="M99 105V293C99 375 145 418 217 418C289 418 329 374 329 299V190" stroke="currentColor" strokeWidth="80" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M329 190V171L405 95M329 271L404 196M326 369L404 291" stroke="currentColor" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="382" y="52" width="82" height="82" rx="21" fill="currentColor" />
        <rect x="382" y="155" width="82" height="72" rx="19" fill="currentColor" />
        <rect x="382" y="260" width="82" height="72" rx="19" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'horizontal') {
    return (
      <svg width={size * 2.5} height={size} viewBox="0 0 1200 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="UDo Logo">
        <defs>
          <linearGradient id={`${id}-h-bg`} x1="0" y1="0" x2="1200" y2="480" gradientUnits="userSpaceOnUse"><stop stopColor="#111420" /><stop offset="1" stopColor="#080A12" /></linearGradient>
          <linearGradient id={`${id}-h-body`} x1="64" y1="60" x2="373" y2="407" gradientUnits="userSpaceOnUse"><stop stopColor="#8984FF" /><stop offset=".55" stopColor="#5551F5" /><stop offset="1" stopColor="#7139F4" /></linearGradient>
          <linearGradient id={`${id}-h-g-link`} x1="297" y1="165" x2="397" y2="67" gradientUnits="userSpaceOnUse"><stop stopColor="#5155F2" /><stop offset="1" stopColor="#17C89B" /></linearGradient>
          <linearGradient id={`${id}-h-v-link`} x1="299" y1="256" x2="399" y2="161" gradientUnits="userSpaceOnUse"><stop stopColor="#534BF1" /><stop offset="1" stopColor="#9B74FF" /></linearGradient>
          <linearGradient id={`${id}-h-a-link`} x1="298" y1="348" x2="399" y2="253" gradientUnits="userSpaceOnUse"><stop stopColor="#6145EC" /><stop offset="1" stopColor="#FFBF4B" /></linearGradient>
          <linearGradient id={`${id}-h-green`} x1="374" y1="40" x2="449" y2="116" gradientUnits="userSpaceOnUse"><stop stopColor="#20D4A6" /><stop offset="1" stopColor="#19BFA0" /></linearGradient>
          <linearGradient id={`${id}-h-violet`} x1="374" y1="139" x2="449" y2="214" gradientUnits="userSpaceOnUse"><stop stopColor="#A986FF" /><stop offset="1" stopColor="#815BEF" /></linearGradient>
          <linearGradient id={`${id}-h-amber`} x1="374" y1="238" x2="449" y2="313" gradientUnits="userSpaceOnUse"><stop stopColor="#FFCA61" /><stop offset="1" stopColor="#F5AD32" /></linearGradient>
          <linearGradient id={`${id}-h-word`} x1="500" y1="62" x2="1139" y2="327" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFFFF" /><stop offset=".48" stopColor="#F3F3FB" /><stop offset="1" stopColor="#E5E5F2" /></linearGradient>
          <filter id={`${id}-h-shadow`} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000022" floodOpacity=".38" /></filter>
        </defs>
        {showBackground && <rect width="1200" height="480" rx="20" fill={`url(#${id}-h-bg)`} />}
        <path d="M94 82V258C94 348 145 394 226 394C306 394 348 347 348 265V184" stroke={`url(#${id}-h-body)`} strokeWidth="82" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M348 184V164L397 115" stroke={`url(#${id}-h-g-link)`} strokeWidth="39" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M348 254L397 205" stroke={`url(#${id}-h-v-link)`} strokeWidth="34" strokeLinecap="round" />
        <path d="M344 344L397 291" stroke={`url(#${id}-h-a-link)`} strokeWidth="34" strokeLinecap="round" />
        <g filter={`url(#${id}-h-shadow)`}>
          <rect x="374" y="39" width="78" height="78" rx="18" fill={`url(#${id}-h-green)`} />
          <rect x="374" y="138" width="78" height="72" rx="17" fill={`url(#${id}-h-violet)`} />
          <rect x="374" y="237" width="78" height="72" rx="17" fill={`url(#${id}-h-amber)`} />
        </g>
        <path d="M527 76V210C527 279 563 318 625 318C688 318 724 279 724 210V76" stroke={`url(#${id}-h-word)`} strokeWidth="62" strokeLinecap="square" strokeLinejoin="round" />
        <path fillRule="evenodd" clipRule="evenodd" d="M779 45H868C967 45 1026 97 1026 180C1026 264 967 316 868 316H779V45ZM846 105V256H870C925 256 957 228 957 180C957 133 925 105 870 105H846Z" fill={`url(#${id}-h-word)`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M1091 127C1151 127 1187 165 1187 222C1187 279 1151 317 1091 317C1031 317 995 279 995 222C995 165 1031 127 1091 127ZM1091 181C1068 181 1055 197 1055 222C1055 247 1068 263 1091 263C1114 263 1127 247 1127 222C1127 197 1114 181 1091 181Z" fill={`url(#${id}-h-word)`} />
        <g transform="translate(524 382)" stroke="#D7D9F9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 0H28M14 0V38M49 0V38M49 23C49 15 54 11 61 11C69 11 73 16 73 24V38M118 25H91C91 16 96 11 104 11C113 11 118 17 118 25ZM92 25C92 34 98 39 107 39C111 39 115 37 117 35M165 12L173 38L182 20L191 38L199 12M240 38V12M240 19C237 14 233 11 227 11C218 11 213 17 213 25C213 34 218 39 227 39C233 39 237 36 240 31M258 12L270 38M283 12L269 43C266 50 262 53 256 53M330 12V28C330 35 334 39 341 39C349 39 353 34 353 27V12M353 12V38M418 0V38M418 19C414 14 410 11 404 11C395 11 390 17 390 25C390 34 395 39 404 39C410 39 414 36 418 31M463 11C453 11 448 17 448 25C448 34 453 39 463 39C472 39 477 34 477 25C477 17 472 11 463 11Z" />
        </g>
        <circle cx="1025" cy="418" r="3.5" fill="#D7D9F9" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="UDo Logo">
      <defs>
        <linearGradient id={`${id}-body`} x1="74" y1="86" x2="370" y2="437" gradientUnits="userSpaceOnUse"><stop stopColor="#8B85FF" /><stop offset="0.5" stopColor="#5352F6" /><stop offset="1" stopColor="#7138F4" /></linearGradient>
        <linearGradient id={`${id}-t-link`} x1="291" y1="171" x2="417" y2="71" gradientUnits="userSpaceOnUse"><stop stopColor="#5253F5" /><stop offset="1" stopColor="#17C89B" /></linearGradient>
        <linearGradient id={`${id}-m-link`} x1="291" y1="275" x2="418" y2="172" gradientUnits="userSpaceOnUse"><stop stopColor="#534CF2" /><stop offset="1" stopColor="#9C73FF" /></linearGradient>
        <linearGradient id={`${id}-b-link`} x1="291" y1="369" x2="418" y2="272" gradientUnits="userSpaceOnUse"><stop stopColor="#5D46EE" /><stop offset="1" stopColor="#FFBF4B" /></linearGradient>
        <linearGradient id={`${id}-green`} x1="392" y1="52" x2="455" y2="122" gradientUnits="userSpaceOnUse"><stop stopColor="#1FD4A5" /><stop offset="1" stopColor="#18BFA0" /></linearGradient>
        <linearGradient id={`${id}-violet`} x1="391" y1="160" x2="457" y2="225" gradientUnits="userSpaceOnUse"><stop stopColor="#A986FF" /><stop offset="1" stopColor="#825CF0" /></linearGradient>
        <linearGradient id={`${id}-amber`} x1="392" y1="266" x2="457" y2="331" gradientUnits="userSpaceOnUse"><stop stopColor="#FFC95F" /><stop offset="1" stopColor="#F5AD32" /></linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#101020" floodOpacity=".18" /></filter>
      </defs>
      <path d="M99 105V293C99 375 145 418 217 418C289 418 329 374 329 299V190" stroke={`url(#${id}-body)`} strokeWidth="80" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M329 190V171L405 95" stroke={`url(#${id}-t-link)`} strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M329 271L404 196" stroke={`url(#${id}-m-link)`} strokeWidth="36" strokeLinecap="round" />
      <path d="M326 369L404 291" stroke={`url(#${id}-b-link)`} strokeWidth="36" strokeLinecap="round" />
      <g filter={`url(#${id}-shadow)`}>
        <rect x="382" y="52" width="82" height="82" rx="21" fill={`url(#${id}-green)`} />
        <rect x="382" y="155" width="82" height="72" rx="19" fill={`url(#${id}-violet)`} />
        <rect x="382" y="260" width="82" height="72" rx="19" fill={`url(#${id}-amber)`} />
      </g>
    </svg>
  );
};
