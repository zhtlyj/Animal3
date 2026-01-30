import React, { useEffect, useState } from 'react';

const Carousel = ({ slides, interval = 4000 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => clearInterval(id);
  }, [slides.length, interval]);

  if (!slides || slides.length === 0) return null;

  const current = slides[index];

  return (
    <div className="carousel">
      <div 
        className="carousel-slide"
        style={{
          backgroundImage: `url(${current.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="carousel-overlay">
          <h2 className="carousel-title">{current.title}</h2>
          <p className="carousel-subtitle">{current.subtitle}</p>
        </div>
      </div>
      <div className="carousel-dots">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`dot ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`切换到第${i + 1}张轮播图`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;



