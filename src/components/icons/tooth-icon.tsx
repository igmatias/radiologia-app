interface ToothIconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

export default function ToothIcon({ size = 24, className = "", strokeWidth = 1.5 }: ToothIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Cuerpo principal del diente con dos raíces */}
      <path d="
        M 8.5 2.5
        C 6 2.5 3 4.5 3 8
        C 3 10.5 4 12 4.5 13.5
        C 5.5 17 6 20.5 7.5 21.5
        C 8.5 22 9.5 20 10.5 17.5
        C 11 16.5 11.5 15.5 12 15.5
        C 12.5 15.5 13 16.5 13.5 17.5
        C 14.5 20 15.5 22 16.5 21.5
        C 18 20.5 18.5 17 19.5 13.5
        C 20 12 21 10.5 21 8
        C 21 4.5 18 2.5 15.5 2.5
        C 14 2.5 13 3.5 12 3.5
        C 11 3.5 10 2.5 8.5 2.5
        Z
      " />
      {/* Surco / fisura en la corona */}
      <path d="M 10 6 C 11.5 5 13.5 5.5 14.5 6.5" />
    </svg>
  )
}
