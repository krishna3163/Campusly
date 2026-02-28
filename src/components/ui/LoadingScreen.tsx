export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-campus-darker flex flex-col items-center justify-center gap-6">
            {/* Animated Logo */}
            <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 flex items-center justify-center animate-bounce-in">
                    <span className="text-3xl font-black text-white">C</span>
                </div>
                <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 animate-ping opacity-20" />
            </div>

            {/* Loading text */}
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-xl font-bold gradient-text">Campusly</h1>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-brand-400 animate-typing" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-typing" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-typing" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        </div>
    );
}
