"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

export default function Loader() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading delay, or replace with actual loading logic
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1 second delay for demo

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {loading && (
        <div className="w-full h-full mx-auto fixed top-0 left-0 flex justify-center items-center bg-black">
          <Image className="animate-spin [animation-duration:10s]" src="/mcr.png" alt="MCR" width={300} height={300} />
        </div>
      )}
    </div>
  )
}
