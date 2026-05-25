import { useEffect, useRef } from 'react';

const GamingBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = -Math.random() * 0.8 - 0.2;
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
        const rand = Math.random();
        if (rand < 0.6) {
          this.color = `rgba(124, 77, 255, `;
        } else if (rand < 0.85) {
          this.color = `rgba(3, 218, 198, `;
        } else {
          this.color = `rgba(255, 107, 53, `;
        }
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;
        if (this.life >= this.maxLife) this.reset();
      }
      draw() {
        const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${alpha})`;
        ctx.fill();
      }
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      const p = new Particle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animated gradient background
      const grad = ctx.createRadialGradient(
        canvas.width * 0.2 + Math.sin(t * 0.3) * 50,
        canvas.height * 0.15 + Math.cos(t * 0.2) * 30,
        0,
        canvas.width * 0.2,
        canvas.height * 0.15,
        canvas.width * 0.7
      );
      grad.addColorStop(0, 'rgba(124, 77, 255, 0.12)');
      grad.addColorStop(0.5, 'rgba(3, 218, 198, 0.04)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad2 = ctx.createRadialGradient(
        canvas.width * 0.8 + Math.cos(t * 0.25) * 40,
        canvas.height * 0.85 + Math.sin(t * 0.3) * 30,
        0,
        canvas.width * 0.8,
        canvas.height * 0.85,
        canvas.width * 0.5
      );
      grad2.addColorStop(0, 'rgba(3, 218, 198, 0.08)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const offsetX = (t * 0.5) % gridSize;
      const offsetY = (t * 0.5) % gridSize;
      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Particles
      particles.forEach(p => { p.update(); p.draw(); });

      // Scan line
      const scanY = ((t * 2) % (canvas.height + 100)) - 50;
      const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(124, 77, 255, 0.3)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 2, canvas.width, 4);

      t += 0.5;
      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#0A0A0F' }}
    />
  );
};

export default GamingBackground;
