import { useLayoutEffect, useRef } from 'react'

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minH?: number
}

export function AutoResizeTextarea({ minH = 44, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(el.scrollHeight, minH) + 'px'
    el.scrollTop = 0
  }, [props.value, minH])

  return <textarea ref={ref} {...props} />
}
