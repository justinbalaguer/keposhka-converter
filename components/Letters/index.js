"use client"
import Image from "next/image"
import { useState } from "react"

export default function Letters() {
  const [numbers, setNumbers] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const [letters, setLetters] = useState([
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "aa",
    "bb",
    "cc",
    "dd",
    "ee",
    "ff",
    "gg",
    "hh",
    "ii",
    "jj",
    "kk",
    "ll",
    "mm",
    "nn",
    "oo",
    "pp",
    "qq",
    "rr",
    "ss",
    "tt",
    "uu",
    "vv",
    "ww",
    "xx",
    "yy",
    "zz",
    "th",
    "thth",
    "sh",
    "shsh",
    "ch",
    "chch",
    "gh",
    "ghgh"
  ])

  const [selectedLetters, setSelectedLetters] = useState([])

  const handleSelectLetter = (letter) => {
    if (letter.length === 1 && letter !== " ") {
      setSelectedLetters([...selectedLetters, letter.toUpperCase()])
      return
    }
    if (letter === "th") {
      setSelectedLetters([...selectedLetters, "Th"])
      return
    }
    if (letter === "thth") {
      setSelectedLetters([...selectedLetters, "th"])
      return
    }
    if (letter === "sh") {
      setSelectedLetters([...selectedLetters, "Sh"])
      return
    }
    if (letter === "shsh") {
      setSelectedLetters([...selectedLetters, "sh"])
      return
    }
    if (letter === "ch") {
      setSelectedLetters([...selectedLetters, "Ch"])
      return
    }
    if (letter === "chch") {
      setSelectedLetters([...selectedLetters, "ch"])
      return
    }
    if (letter === "gh") {
      setSelectedLetters([...selectedLetters, "Gh"])
      return
    }
    if (letter === "ghgh") {
      setSelectedLetters([...selectedLetters, "gh"])
      return
    }
    if (letter.length >= 2) {
      setSelectedLetters([...selectedLetters, letter.split("")[0].toLowerCase()])
      return
    }
    setSelectedLetters([...selectedLetters, letter])
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedLetters.join(""))
  }

  const handleDelete = () => {
    setSelectedLetters(selectedLetters.slice(0, -1))
  }

  return (
    <div className="lg:mx-5 overflow-x-hidden">
      <div className="flex justify-center items-center my-5 font-bold text-white text-xl lg:text-3xl">
        <h1>Keposhka Converter</h1>
      </div>
      <div className="text-white text-xl lg:text-3xl overflow-auto whitespace-pre-line flex flex-row justify-center items-center w-full my-5">
        <p className="w-full rounded h-auto border-2 border-gray-500 p-5 break-words">
          {selectedLetters.join("") || <span className="text-gray-500">Converted letters</span>}
        </p>
      </div>
      <div className="flex flex-row flex-wrap justify-center items-center gap-1 lg:gap-3 my-3">
        {numbers.map((number, index) => (
          <div className="text-2xl lg:text-6xl text-[#8b1214] font-bold cursor-pointer px-2 lg:px-3 lg:py-1 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95" key={index} onClick={() => handleSelectLetter(number)}>
            <p>{number}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-row flex-wrap justify-center items-center gap-1 lg:gap-3">
        { letters.sort().map((letter, index) => (
          <div className="cursor-pointer p-3 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95" key={index} onClick={() => handleSelectLetter(letter)}>
            <Image className="w-5 h-5 lg:w-10 lg:h-10" src={`/assets/${letter}.png`} alt={letter} width={50} height={50} />
          </div>
        ))}
      </div>
      <div className="my-5 flex justify-between items-stretch gap-5 mx-3 lg:mx-5">
        <div className="text-[#8b1214] font-bold text-xl lg:text-3xl flex justify-center items-center cursor-pointer p-3 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95 w-[80%]" onClick={handleCopy}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 0 1-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0 1 13.5 1.5H15a3 3 0 0 1 2.663 1.618ZM12 4.5A1.5 1.5 0 0 1 13.5 3H15a1.5 1.5 0 0 1 1.5 1.5H12Z" clipRule="evenodd" />
            <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 0 1 9 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0 1 16.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625v-12Z" />
            <path d="M10.5 10.5a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V10.5Z" />
          </svg>
        </div>
        <div className="text-[#8b1214] font-bold text-xl lg:text-3xl flex justify-center items-center cursor-pointer p-3 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95 w-[80%]" onClick={() => handleSelectLetter(" ")}>
          <p>Space</p>
        </div>
        <div className="text-[#8b1214] font-bold text-xl lg:text-3xl flex justify-center items-center cursor-pointer p-3 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95 w-[80%]" onClick={handleDelete}>
          <p>Del</p>
        </div>
      </div>
    </div>
  );
}
