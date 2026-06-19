import { motion } from 'motion/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
}

const textSizes = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
}

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="relative">
        <motion.div
          className={`${sizes[size]} rounded-full border-2 border-slate-800`}
        />
        <motion.div
          className={`absolute inset-0 ${sizes[size]} rounded-full border-2 border-transparent border-t-[#a78bfa]`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className={`absolute inset-0 ${sizes[size]} rounded-full border-2 border-transparent border-b-[#7c3aed]`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-[#a78bfa]" />
        </motion.div>
      </div>
      {message && (
        <motion.span
          className={`font-mono uppercase tracking-[0.2em] text-slate-500 ${textSizes[size]}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message}
        </motion.span>
      )}
    </motion.div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0f172a] border border-slate-800 rounded-2xl p-5 overflow-hidden ${className}`}
    >
      <div className="space-y-3">
        <div className="h-4 bg-slate-800/60 rounded-full w-3/4 skeleton-pulse" />
        <div className="h-3 bg-slate-800/60 rounded-full w-1/2 skeleton-pulse" />
        <div className="h-3 bg-slate-800/60 rounded-full w-full skeleton-pulse" />
        <div className="h-3 bg-slate-800/60 rounded-full w-5/6 skeleton-pulse" />
      </div>
    </motion.div>
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`h-3 bg-slate-800/60 rounded-full skeleton-pulse ${className}`} />
  )
}
