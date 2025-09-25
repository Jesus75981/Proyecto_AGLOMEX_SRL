// src/components/Carousel.jsx (con react-slick)
import React from 'react';
import Slider from 'react-slick';
import ProductCard from './productCard';

const Carousel = ({ products, onProductSelect }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <div className="slick-container">
      <Slider {...settings}>
        {products.map((product) => (
          <div key={product._id} className="p-2">
            <ProductCard product={product} onProductSelect={onProductSelect} />
          </div>
        ))}
      </Slider>
    </div>
  );
};
