import { Button } from "@/components/ui/button"

export default function App() {
    const version = import.meta.env.VITE_APP_VERSION ?? "dev"

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-semibold">Hello, NPP!</h1>
            <Button>OK</Button>
            <p className="text-sm opacity-70">v{version}</p>
        </div>
    )
}
