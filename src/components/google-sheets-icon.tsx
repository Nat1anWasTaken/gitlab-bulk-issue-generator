import * as React from "react";

type GoogleSheetsIconProps = React.SVGProps<SVGSVGElement>;

export function GoogleSheetsIcon(props: GoogleSheetsIconProps) {
  const maskId = React.useId();
  const filterId = React.useId();
  const gradientId = React.useId();

  return (
    <svg
      viewBox="0 0 192 192"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="#009954"
        d="M8 74.6c0-8.943 0-13.415 1.404-16.962a20 20 0 0 1 11.234-11.233C24.185 45 28.656 45 37.6 45h60.8c8.943 0 13.415 0 16.962 1.404a20 20 0 0 1 11.234 11.234C128 61.185 128 65.656 128 74.6v42.8c0 8.943 0 13.415-1.404 16.962a20 20 0 0 1-11.234 11.234C111.815 147 107.343 147 98.4 147H37.6c-8.943 0-13.415 0-16.963-1.404a20 20 0 0 1-11.233-11.234C8 130.815 8 126.343 8 117.4z"
      />
      <mask
        id={maskId}
        width="160"
        height="128"
        x="24"
        y="32"
        maskUnits="userSpaceOnUse"
        style={{ maskType: "alpha" }}
      >
        <rect width="160" height="128" x="24" y="32" fill="#0EBC5F" rx="20" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path fill="#0EBC5F" d="M24 32h160v128H24z" />
        <g filter={`url(#${filterId})`}>
          <rect
            width="144"
            height="102"
            fill={`url(#${gradientId})`}
            rx="25.6"
            transform="matrix(1 0 0 -1 8 147)"
          />
        </g>
      </g>
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="12"
        d="M80 121h84m-20 19V76"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="122.24"
          x2="20.76"
          y1="43.31"
          y2="43.31"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0EBC5F" />
          <stop offset=".95" stopColor="#78C9FF" />
        </linearGradient>
        <filter
          id={filterId}
          width="168"
          height="126"
          x="-4"
          y="33"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_37435_8174"
            stdDeviation="6"
          />
        </filter>
      </defs>
    </svg>
  );
}
