import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#b1ada1' }}>
      <SignUp />
    </div>
  )
}