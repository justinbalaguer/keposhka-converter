"use client"
import Link from "next/link"
import "./footer.css"

export default function Footer() {
  return (
    <footer className="kp-foot">
      <small>
        made with ❤️ by{" "}
        <Link href="https://justinbalaguer.dev" target="_blank">
          ojintoji
        </Link>
      </small>
    </footer>
  )
}
