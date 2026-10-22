"use client"
import Link from "next/link"
import "./footer.css"

export default function Footer() {
  return (
    <footer className="kp-foot">
      <Link href="https://www.buymeacoffee.com/ojintoji" target="_blank" className="kp-foot-support">
        Support for MCR Ticket 🥺
      </Link>
      <small>
        made with ❤️ by{" "}
        <Link href="https://justinbalaguer.dev" target="_blank">
          ojintoji
        </Link>
      </small>
    </footer>
  )
}
