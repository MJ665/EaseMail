// app/components/Logo.tsx
export default function Logo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" fillRule="evenodd">
        <path
          d="M40 20c0 11.046-8.954 20-20 20S0 31.046 0 20 8.954 0 20 0s20 8.954 20 20"
          fill="url(#a)"
          transform="matrix(-1 0 0 1 40 0)"
        ></path>
        <path
          d="M32.175 12.15L8.9 25.466a1.492 1.492 0 00-.916 1.745l2.451 8.825c.34 1.226 1.638 1.943 2.872 1.59l20.89-6.07a1.492 1.492 0 00.916-1.745l-2.45-8.825a1.492 1.492 0 00-2.873-1.59z"
          fill="#FFF"
          opacity=".6"
        ></path>
        <path
          d="M29.724 8.976l-20.89 6.07a1.492 1.492 0 00-.916 1.745l2.451 8.825c.34 1.226 1.638 1.943 2.872 1.59l20.89-6.07a1.492 1.492 0 00.916-1.745l-2.45-8.825a1.492 1.492 0 00-2.873-1.59z"
          fill="#FFF"
        ></path>
      </g>
      <defs>
        <linearGradient
          x1="50%"
          y1="0%"
          x2="50%"
          y2="100%"
          id="a"
        >
          <stop stopColor="#57C785" offset="0%"></stop>
          <stop stopColor="#2A7B9B" offset="100%"></stop>
        </linearGradient>
      </defs>
    </svg>
  );
}