'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

const ImageModal = ({ isImageModalOpen, closeImageModal, selectedImage }) => {
  if (!isImageModalOpen || !selectedImage) return null;

  return (
    <AnimatePresence>
      {isImageModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeImageModal}
          className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative max-w-lg max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              loading="lazy"
              src={selectedImage}
              alt="صورة الطالب"
              className="block max-w-full max-h-[80vh] object-contain rounded-3xl"
              onError={(e) => {
                e.target.src = defaultAvatar;
                e.target.alt = 'Default Avatar';
              }}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              aria-label="إغلاق الصورة"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;
