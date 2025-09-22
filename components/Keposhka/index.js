"use client"
import { useState } from "react"

export default function Keposhka() {
  const [text, setText] = useState([])
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

  function splitStringByN(str, n) {
    const result = [];
    for (let i = 0; i < str.length; i += n) {
      result.push(str.substring(i, i + n));
    }
    return result;
  }

  function handleTextChange(event) {
    setText(event.target.value)
  }

  function convert() {
    const newArray = [];
    let currentText = text;

    let i = 2;

    while (i >= 1 && currentText.length > 0) {
      let splittedArray = splitStringByN(currentText, i);
      if (splittedArray.length === 0) break;

      let wordForCheck = splittedArray[0];

      if (wordForCheck === " ") {
        newArray.push("space");
        currentText = currentText.slice(1);
        i = 2;
        continue;
      }

      if (wordForCheck.length === 2) {
        const splitted = wordForCheck.split("");
        if (splitted[0] === splitted[0].toUpperCase()) {
          wordForCheck = wordForCheck.toLowerCase();
        } else {
          wordForCheck = wordForCheck.toLowerCase() + wordForCheck.toLowerCase();
        }
      }

      if (wordForCheck.length === 1 && wordForCheck !== " " && wordForCheck === wordForCheck.toLowerCase()) {
        wordForCheck = wordForCheck.toLowerCase() + wordForCheck.toLowerCase();
      } else if (wordForCheck.length === 1 && wordForCheck !== " " && wordForCheck === wordForCheck.toUpperCase()) {
        wordForCheck = wordForCheck.toLowerCase();
      }

      if (letters.includes(wordForCheck)) {
        newArray.push(wordForCheck);
        currentText = currentText.slice(splittedArray[0].length);
        i = 2;
      } else {
        i--;
      }
    }

    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    const imgSize = Math.floor(rect.width / 12); // 12 images per row, adjust as needed
    const maxPerRow = Math.floor(rect.width / imgSize);
    const numRows = Math.ceil(newArray.length / maxPerRow);

    // Responsive: set the canvas height dynamically (scaled for DPR)
    canvas.width = rect.width * dpr;
    canvas.height = numRows * imgSize * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    newArray.forEach((letter, index) => {
      const img = new Image();
      img.src = letter === "space" ? "/assets/space.png" : `/assets/${letter}.png`;
      img.onload = () => {
        const col = index % maxPerRow;
        const row = Math.floor(index / maxPerRow);
        ctx.drawImage(img, col * imgSize, row * imgSize, imgSize, imgSize);
      };
    });
  }

  function saveImage() {
    const canvas = document.querySelector("canvas");
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "keposhka.png";
    link.href = dataURL;
    link.click();
  }

  return (
    <div className="text-white p-4">
      <textarea
        className="w-full h-[10em] rounded border border-red-500/20 p-2"
        placeholder="Write here..."
        onChange={handleTextChange}
      >
      </textarea>
      <div className="flex justify-center items-center gap-5">
        <button onClick={convert} className="flex gap-2 justify-center items-center bg-[#121212] text-[#8b1214] font-bold py-2 px-4 rounded cursor-pointer hover:bg-[#151515]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
          </svg>
          <span>Convert</span>
        </button>
        <button onClick={saveImage} className="flex gap-2 justify-center items-center bg-[#121212] text-[#8b1214] font-bold py-2 px-4 rounded cursor-pointer hover:bg-[#151515]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
          <span>Save Image</span>
        </button>
      </div>
      <div className="mt-5">
        <canvas className="w-full h-auto"></canvas>
      </div>
    </div>
  );
}
