import React from 'react'

// Props opcionais para tamanho e cor, com valores padrão
interface AppIconProps {
  size?: number
  color?: string
  className?: string
}

export const AppIcon: React.FC<AppIconProps> = ({
  size = 32,
  color = 'var(--accent-color)', // Usa a variável CSS do nosso tema (azul)
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fundo circular suave */}
      <circle cx="128" cy="128" r="120" fill={color} fillOpacity="0.1" />
      /* Borda circular */
      <circle cx="128" cy="128" r="120" stroke={color} strokeWidth="12" />
      {/* O corpo do metrônomo (estilizado como um 'A' moderno) */}
      <path
        d="M128 40L60 200H196L128 40Z"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* O pêndulo/pulso central */}
      <line
        x1="128"
        y1="40"
        x2="128"
        y2="160"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* O ponto de batida (brilhante) */}
      <circle cx="128" cy="160" r="16" fill={color} />
    </svg>
  )
}
