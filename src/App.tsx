import NoiseLab from "@/pages/NoiseLab"
import MobileBlocker from "@/components/MobileBlocker"
import { useIsMobile } from "@/lib/useIsMobile"

export default function App() {
  const isMobile = useIsMobile()
  return (
    <div className="h-full bg-background text-foreground">
      {isMobile ? <MobileBlocker /> : <NoiseLab />}
    </div>
  )
}
