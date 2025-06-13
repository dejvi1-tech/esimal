import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: 'Anna K.',
    review: 'Super easy to use and worked instantly when I landed. Highly recommend!',
    rating: 5,
    country: 'Germany',
  },
  {
    name: 'John D.',
    review: 'Saved me a lot on roaming fees. Setup was a breeze!',
    rating: 5,
    country: 'USA',
  },
  {
    name: 'Elena P.',
    review: 'Great support and fast activation. Will use again for my next trip.',
    rating: 4,
    country: 'Italy',
  },
];

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
  </svg>
);

const TestimonialsSection: React.FC = () => (
  <section className="py-16 bg-gradient-to-b from-white to-blue-50">
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">What Our Customers Say</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((n) => <Star key={n} filled={n <= t.rating} />)}
            </div>
            <p className="text-gray-700 text-lg mb-4">“{t.review}”</p>
            <div className="font-semibold text-blue-700">{t.name}</div>
            <div className="text-xs text-gray-400">{t.country}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;