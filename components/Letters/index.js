"use client"
import Image from "next/image"
import { useState } from "react"

export default function Letters() {
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
    console.log("asdasd")
    console.log(selectedLetters)
  }

  return (
    <div className="lg:mx-5 overflow-x-hidden">
      <div className="text-white text-3xl overflow-auto whitespace-pre-line flex flex-row justify-center items-center w-full my-5">
        <p className="w-full rounded h-auto border-2 p-5 break-words">
          {selectedLetters.join("") || <span className="text-gray-500">Converted letters</span>}
        </p>
      </div>
      <div className="flex flex-row flex-wrap justify-center items-center gap-3">
        { letters.sort().map((letter, index) => (
          <div className="cursor-pointer p-3 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95" key={index} onClick={() => handleSelectLetter(letter)}>
            <Image src={`/assets/${letter}.png`} alt={letter} width={50} height={50} />
          </div>
        ))}
      </div>
      <div className="my-5 flex justify-center items-center">
        <div className="text-red-800 font-bold text-3xl flex justify-center items-center cursor-pointer p-3 rounded bg-[#121212] hover:bg-[#181818] hover:scale-105 duration-300 active:scale-95 w-[80%]" onClick={() => handleSelectLetter(" ")}>
          <p>Space</p>
        </div>
      </div>
    </div>
  );
}
