"use client"
import Link from "next/link"

export default function Footer() {
  return (
    <div className="flex flex-col w-full justify-center items-center my-5 gap-2">
      <small className="text-[#A8A8A8]">made with ❤️ by <Link href="https://justinbalaguer.dev" target="_blank" className="underline">ojintoji</Link></small>
      <Link href="https://www.buymeacoffee.com/ojintoji" target="_blank" className="flex flex-col items-center text-xs text-black bg-[#FFDD22] px-4 py-2 rounded">
        <p>Support for MCR Ticket 🥺</p>
      </Link>
    </div>
  )
}
