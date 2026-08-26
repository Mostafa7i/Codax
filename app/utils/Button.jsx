'use client';
import React, { useState } from 'react'
import CourseRating from '../components/CourseRating'

export default function Button() {
    const [openModel , setOpenModel] = useState(false)
  return (
    <div>
      <button onClick={() => setOpenModel(true)} className='bg-linear-to-r from-orange-400 to-orange-600 px-3 py-1.5 animate-pulse cursor-pointer hover:outline-1 hover:scale-105 rounded-2xl text-lg'>قيمنا الان</button>


        {/* Modals */}
       {openModel && (
         <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <CourseRating setOpenModel={setOpenModel}  courseId="codax-fullstack" />
         </div>
       )}
    </div>
  )
}
