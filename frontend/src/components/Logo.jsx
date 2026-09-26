/**
 * The Klear And Klarity logo. The image sits on a light plate so it stays legible
 * whatever colours the artwork uses.
 */
export default function Logo({ size = 'md', showText = true, className = '' }) {
  const box = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-16 w-16' }[size] ?? 'h-10 w-10'
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size] ?? 'text-lg'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${box} flex shrink-0 items-center justify-center overflow-hidden rounded-xl
                    bg-white ring-1 ring-slate-200 shadow-sm`}
      >
        <img src="/logo.jpeg" alt="Klear And Klarity logo" className="h-full w-full object-contain" />
      </span>
      {showText && (
        <span className={`${text} font-bold leading-tight tracking-tight text-slate-900`}>
          Klear
          <span className="text-brand-700"> And Klarity</span>
        </span>
      )}
    </span>
  )
}
