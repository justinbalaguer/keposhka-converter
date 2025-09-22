"use client"
import { useState } from "react"
import { Letters, Keposhka } from "@/components"

export default function Header() {
  const [active, setActive] = useState("keposhka")

  return (
    <div>
      <div className="flex justify-around items-center my-5 font-bold text-white text-sm lg:text-xl border border-red-500/20 rounded-full mx-2 p-1">
        <button
          className={`${active === "keposhka" ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 px-3 py-1" : "px-3 py-1"} flex justify-center items-center gap-2 rounded-full`}
          onClick={() => setActive("keposhka")}
        >
          <span>
            Keposhka
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M2 8c0 .414.336.75.75.75h8.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H2.75A.75.75 0 0 0 2 8Z" clipRule="evenodd" />
          </svg>
          <span>
            English
          </span>
        </button>
        <button
          className={`${active === "english" ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 px-3 py-1" : "px-3 py-1"} flex justify-center items-center gap-2 rounded-full`}
          onClick={() => setActive("english")}
        >
          <span>
            English
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M2 8c0 .414.336.75.75.75h8.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H2.75A.75.75 0 0 0 2 8Z" clipRule="evenodd" />
          </svg>
          <span>
            Keposhka
          </span>
        </button>
      </div>
      {active === "keposhka" && <Letters />}
      {active === "english" && <Keposhka />}
    </div>
  );
}
