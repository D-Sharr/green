export const postcardHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Chinese New Year! • Green Weather</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #c21f26;
            overflow: hidden;
        }
        .chinese-font {
            font-family: 'Ma Shan Zheng', cursive;
        }
        .card-container {
            background: linear-gradient(135deg, #c21f26 0%, #a51b21 100%);
            border: 4px solid #f9ce69;
            box-shadow: 0 0 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(249, 206, 105, 0.2);
        }
        .lantern {
            animation: swing 3s ease-in-out infinite alternate;
            transform-origin: top center;
        }
        @keyframes swing {
            0% { transform: rotate(-5deg); }
            100% { transform: rotate(5deg); }
        }
        .sparkle {
            position: absolute;
            background: #f9ce69;
            border-radius: 50%;
            opacity: 0;
            animation: sparkleAnim var(--duration) linear infinite;
        }
        @keyframes sparkleAnim {
            0% { transform: scale(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .floating-element {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <!-- Animated Background Elements -->
    <div id="sparkleLayer" class="absolute inset-0 pointer-events-none"></div>
    
    <!-- Top Decorative Lanterns -->
    <div class="absolute top-0 left-10 md:left-20 lantern text-6xl md:text-8xl">🏮</div>
    <div class="absolute top-0 right-10 md:right-20 lantern text-6xl md:text-8xl" style="animation-delay: -1.5s">🏮</div>

    <!-- Main Card -->
    <div class="card-container relative max-w-lg w-full rounded-2xl p-8 md:p-12 text-center transform transition-transform hover:scale-[1.02] duration-500">
        <!-- Corner Decorations -->
        <div class="absolute top-4 left-4 text-[#f9ce69] opacity-40 text-2xl">㊙️</div>
        <div class="absolute top-4 right-4 text-[#f9ce69] opacity-40 text-2xl">㊙️</div>
        <div class="absolute bottom-4 left-4 text-[#f9ce69] opacity-40 text-2xl">㊙️</div>
        <div class="absolute bottom-4 right-4 text-[#f9ce69] opacity-40 text-2xl">㊙️</div>

        <!-- Center Dragon Icon -->
        <div class="mb-6 floating-element inline-block">
            <span class="text-7xl md:text-8xl drop-shadow-lg">🐉</span>
        </div>

        <h1 class="chinese-font text-[#f9ce69] text-6xl md:text-7xl mb-4 drop-shadow-md">恭喜发财</h1>
        <h2 class="text-2xl md:text-3xl font-semibold text-[#f9ce69] mb-8 tracking-wide uppercase">Happy Chinese New Year!</h2>
        
        <div class="space-y-4 mb-10">
            <div class="flex items-center justify-center gap-4 text-4xl">
                <span>🧧</span>
                <span>🧨</span>
                <span>🧧</span>
            </div>
            <p class="text-[#f9ce69] opacity-90 text-lg md:text-xl font-light italic">
                Wishing you a year filled with prosperity, joy, and boundless adventure.
            </p>
        </div>

        <!-- Call to Action Section -->
        <div class="bg-black/20 rounded-xl p-6 border border-[#f9ce69]/30">
            <p class="text-white/80 text-sm md:text-base mb-2">H2 Tunnel</p>
            <div class="flex items-center justify-center gap-2 text-[#f9ce69]">
                <i class="fa-solid fa-mobile-screen-button"></i>
                <span class="font-bold text-lg tracking-widest uppercase">Enjoy with our services</span>
            </div>
            <p class="text-[#f9ce69]/60 text-xs mt-3">Please connect our page or telegram.</p>
        </div>

        <!-- Bottom Border Accent -->
        <div class="mt-8 pt-6 border-t border-[#f9ce69]/20">
            <p class="text-[#f9ce69]/40 text-[10px] uppercase tracking-[0.2em]">Tradition • Prosperity • Connection</p>
        </div>
    </div>

    <!-- Script for Sparkles -->
    <script>
        const layer = document.getElementById('sparkleLayer');
        const count = 30;
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            const size = Math.random() * 4 + 2 + 'px';
            sparkle.style.width = size;
            sparkle.style.height = size;
            sparkle.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
            sparkle.style.animationDelay = Math.random() * 5 + 's';
            layer.appendChild(sparkle);
        }
    </script>
</body>
</html>
`;
