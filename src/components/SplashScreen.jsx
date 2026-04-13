import ScriptureGraphLogo from './ScriptureGraphLogo'

export const SplashScreen = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center font-sans bg-canvas dark:bg-canvas-dark gap-8">

            <ScriptureGraphLogo size={128} />

            <div className="flex flex-col items-center gap-2">
                <div className="text-xl tracking-[0.3em] text-primary dark:text-primary-dark font-medium">
                    SCRIPTURE GRAPH
                </div>
                <div className="text-xs tracking-[0.2em] text-tertiary dark:text-tertiary-dark uppercase">
                    Over 340,000 biblical cross-references
                </div>
            </div>

            <div className="w-64 h-px bg-hairline dark:bg-hairline-dark overflow-hidden">
                <div className="h-full bg-gold" style={{ animation: 'loading 1.8s ease-in-out infinite' }} />
            </div>

            <style>{`
      @keyframes loading {
        0%   { width: 0%;  margin-left: 0%; }
        50%  { width: 60%; margin-left: 20%; }
        100% { width: 0%;  margin-left: 100%; }
      }
    `}</style>
        </div>
    )
}